import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const API_KEY = Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("OPENAI_API_KEY") || "";

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-pro";

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
  adminClient: ReturnType<typeof createClient>,
  userId: string,
  inputTok: number,
  outputTok: number,
) {
  try {
    const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
    await adminClient.from("api_usage_logs").insert({
      user_id: userId, feature: "mock_exam", model: MODEL,
      input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
    });
  } catch (e) { console.error("usage log failed:", e); }
}

async function markQuestion(
  question: QuestionToMark,
  systemPrompt: string,
  examBoard: string,
  subject: string,
  adminClient: ReturnType<typeof createClient>,
  userId: string,
): Promise<MarkResult> {
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
    const response = await fetch(AI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: markingPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logStep("ERROR: AI request failed", { status: response.status, error: errorText });
      return {
        question_number: question.question_number,
        marks_awarded: 0,
        marks_available: question.marks_available,
        feedback: "Marking failed — please retry.",
        level: "N/A",
      };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    await logUsage(adminClient, userId, data.usage?.prompt_tokens || 0, data.usage?.completion_tokens || 0);

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const supabaseClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "", {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
      auth: { persistSession: false },
    });

    const { data: authData, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "not_authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;
    const { result_id } = await req.json();

    if (!result_id) {
      return new Response(JSON.stringify({ error: "result_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Starting mock exam marking", { userId, resultId: result_id });

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // Fetch the result record
    const { data: result, error: resultError } = await supabaseAdmin
      .from("mock_results")
      .select("*, mock_papers(*)")
      .eq("id", result_id)
      .eq("user_id", userId)
      .single();

    if (resultError || !result) {
      logStep("ERROR: Result not found", { resultError });
      return new Response(JSON.stringify({ error: "Result not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Failed to save results" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    logStep("Marking complete", { totalScore, maxScore, percentage });

    return new Response(
      JSON.stringify({
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        question_results: allResults,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    logStep("ERROR: Unexpected", { error: (error as Error).message });
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
