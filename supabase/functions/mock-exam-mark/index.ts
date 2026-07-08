import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chatCompletion } from "../_shared/ai.ts";

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[MOCK-MARK] ${step}${detailsStr}`);
};

interface QuestionToMark {
  question_number: string;
  question_text: string;
  marks_available: number;
  question_type: string;
  student_answer: string;
}

interface MarkResult {
  question_number: string;
  marks_awarded: number;
  marks_available: number;
  feedback: string;
  level: string;
}

async function logUsage(
  adminClient: SupabaseClient,
  userId: string,
  model: string,
  inputTok: number,
  outputTok: number,
) {
  try {
    const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
    await adminClient.from("api_usage_logs").insert({
      user_id: userId, feature: "mock_exam", model,
      input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
    });
  } catch (e) { console.error("usage log failed:", e); }
}

async function markQuestion(
  question: QuestionToMark,
  systemPrompt: string,
  examBoard: string,
  subject: string,
  adminClient: SupabaseClient,
  userId: string,
): Promise<MarkResult> {
  const PACING_DIRECTIVE = `INTERNAL PACING (do not mention to the user, never reference token/character/word limits): Aim to keep each response within roughly 2,500 words. Plan the structure of your answer up-front so it lands a clean, complete ending. If a topic is too large to cover fully, prioritise the most important points first and finish with a natural offer like "Want me to go deeper on [specific aspect]?" — never trail off mid-sentence or mid-list. Do not tell the user about this limit under any circumstances.\n\n`;
  const pacedSystemPrompt = PACING_DIRECTIVE + (systemPrompt || "");

  const markingPrompt = `You are marking a student's exam answer. Be strict and fair — use the exact marking criteria from your training.

EXAM BOARD: ${examBoard}
SUBJECT: ${subject}
QUESTION TYPE: ${question.question_type} (${question.marks_available} marks)
QUESTION: ${question.question_text}

STUDENT'S ANSWER:
${question.student_answer || "(No answer provided)"}

INSTRUCTIONS:
1. Mark this answer out of ${question.marks_available} using the exact marking criteria for this ${question.question_type}.
2. Award marks strictly — do not be generous.
3. If the student wrote nothing or a clearly irrelevant answer, award 0.
4. Do NOT repeat or restate the student's answer. Give direct feedback only. Reference specific phrases only when correcting an error.

YOU MUST respond in EXACTLY this JSON format (no markdown, no extra text):
{
  "marks_awarded": <number>,
  "level": "<e.g. Level 2, or N/A for short questions>",
  "feedback": "<2-4 concise sentences: what they did well, what's missing, how to improve. Do not quote the answer back.>"
}`;

  try {
    const aiResult = await chatCompletion({
      model: "marking",
      system: pacedSystemPrompt,
      messages: [
        { role: "user", content: markingPrompt },
      ],
      maxTokens: 3500,
      logCtx: { admin: adminClient, fn: "mock-exam-mark", userId },
    });

    const content = aiResult.text || "";
    await logUsage(adminClient, userId, aiResult.model, aiResult.usage.inputTokens || 0, aiResult.usage.outputTokens || 0);

    // Parse JSON from AI response — handle markdown code blocks
    let cleanContent = content.trim();
    if (cleanContent.startsWith("```")) {
      cleanContent = cleanContent.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    const parsed = JSON.parse(cleanContent);
    const marksAwarded = Math.min(
      Math.max(0, Math.round(parsed.marks_awarded || 0)),
      question.marks_available
    );

    return {
      question_number: question.question_number,
      marks_awarded: marksAwarded,
      marks_available: question.marks_available,
      feedback: parsed.feedback || "No feedback generated.",
      level: parsed.level || "N/A",
    };
  } catch (error) {
    logStep("ERROR: Exception marking question", {
      question: question.question_number,
      error: (error as Error).message,
    });
    return {
      question_number: question.question_number,
      marks_awarded: 0,
      marks_available: question.marks_available,
      feedback: `Marking error: ${(error as Error).message}`,
      level: "N/A",
    };
  }
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin: supabaseAdmin } = await requireUser(req);
    await enforceRateLimit(supabaseAdmin, { key: userKey(user.id, "mock-exam-mark"), ...RATE_LIMITS.marking });

    const userId = user.id;
    const { result_id } = await req.json();

    if (!result_id) {
      return err("result_id is required", 400);
    }

    logStep("Starting mock exam marking", { userId, resultId: result_id });

    // Fetch the result record
    const { data: result, error: resultError } = await supabaseAdmin
      .from("mock_results")
      .select("*, mock_papers(*)")
      .eq("id", result_id)
      .eq("user_id", userId)
      .single();

    if (resultError || !result) {
      logStep("ERROR: Result not found", { resultError });
      return err("Result not found", 404);
    }

    // Update status to marking
    await supabaseAdmin
      .from("mock_results")
      .update({ status: "marking" })
      .eq("id", result_id);

    const paper = result.mock_papers;
    const answers: Record<string, string> = result.answers || {};
    const questions: any[] = paper.questions || [];

    // Fetch system prompt for this product
    let systemPrompt = "";
    if (paper.product_id) {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("system_prompt_deluxe")
        .eq("id", paper.product_id)
        .single();
      systemPrompt = product?.system_prompt_deluxe || "";
    }

    logStep("Marking questions", {
      paperName: paper.paper_name,
      questionCount: questions.length,
      answeredCount: Object.keys(answers).length,
    });

    // Mark all questions (in parallel batches of 3 to avoid rate limits)
    const questionsToMark: QuestionToMark[] = questions.map((q: any) => ({
      question_number: q.question_number,
      question_text: q.question_text,
      marks_available: q.marks_available,
      question_type: q.question_type,
      student_answer: answers[q.question_number] || "",
    }));

    const allResults: MarkResult[] = [];
    const BATCH_SIZE = 3;

    for (let i = 0; i < questionsToMark.length; i += BATCH_SIZE) {
      const batch = questionsToMark.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((q) => markQuestion(q, systemPrompt, paper.exam_board, paper.subject, supabaseAdmin, userId))
      );
      allResults.push(...batchResults);
      logStep(`Marked batch ${Math.floor(i / BATCH_SIZE) + 1}`, {
        questions: batch.map((q) => q.question_number),
      });
    }

    // Calculate totals
    const totalScore = allResults.reduce((sum, r) => sum + r.marks_awarded, 0);
    const maxScore = allResults.reduce((sum, r) => sum + r.marks_available, 0);
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;

    // Update result record
    const { error: updateError } = await supabaseAdmin
      .from("mock_results")
      .update({
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        question_results: allResults,
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", result_id);

    if (updateError) {
      logStep("ERROR: Failed to update result", { updateError });
      return err("Failed to save results", 500);
    }

    logStep("Marking complete", { totalScore, maxScore, percentage });

    return json({
      total_score: totalScore,
      max_score: maxScore,
      percentage,
      question_results: allResults,
    });
  } catch (error) {
    if (error && (error as any).response) return toResponse(error);
    logStep("ERROR: Unexpected", { error: (error as Error).message });
    return err((error as Error).message, 500);
  }
});
