import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    const {
      product_id,
      spec_code,
      spec_name,
      board,
      options = [],
      past_paper_context = "",
      diagram_context = "",
      user_id,
    } = await req.json();

    if (!spec_code || !spec_name || !product_id) {
      return new Response(
        JSON.stringify({ error: "spec_code, spec_name, and product_id are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Revision guide for ${board} spec ${spec_code}: ${spec_name}`);

    // Server-side subscription check
    let tier = "free";
    if (user_id && product_id) {
      try {
        const { data: sub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("tier, subscription_end")
          .eq("user_id", user_id)
          .eq("product_id", product_id)
          .eq("active", true)
          .maybeSingle();

        if (sub?.tier === "deluxe") {
          if (!sub.subscription_end || new Date(sub.subscription_end) > new Date()) {
            tier = "deluxe";
          }
        }
      } catch (err) {
        console.error("Error verifying subscription:", err);
      }
    }

    console.log(`User ${user_id} tier: ${tier}`);

    // Tool usage limit for free users (2 per month)
    if (tier === "free" && user_id) {
      const { data: usageData, error: usageError } = await supabaseAdmin.rpc("increment_tool_usage", {
        p_user_id: user_id,
        p_product_id: product_id,
        p_tool_type: "revision_guide",
        p_limit: 2,
      });

      if (!usageError && usageData?.exceeded) {
        return new Response(
          JSON.stringify({
            error: "limit_exceeded",
            message: "You've used your 2 free revision guides this month. Upgrade to Deluxe for unlimited guides!",
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch system prompt from DB
    let systemPromptBase = "";
    try {
      const { data: product } = await supabaseAdmin
        .from("products")
        .select("system_prompt_deluxe")
        .eq("id", product_id)
        .single();
      systemPromptBase = product?.system_prompt_deluxe || "";
    } catch (err) {
      console.error("Error fetching system prompt:", err);
    }

    // Fetch relevant document chunks for context
    let trainingContext = "";
    try {
      const { data: chunks } = await supabaseAdmin
        .from("document_chunks")
        .select("content, metadata")
        .eq("product_id", product_id)
        .limit(20);

      if (chunks && chunks.length > 0) {
        // Filter chunks relevant to this spec point or exam technique
        const specCodeLower = spec_code.toLowerCase();
        const specNameLower = spec_name.toLowerCase();
        const specKeywords = specNameLower.split(/[\s,()]+/).filter((w: string) => w.length > 2);

        const relevantChunks = chunks.filter((chunk: { content: string; metadata: Record<string, unknown> }) => {
          const content = chunk.content.toLowerCase();
          const contentType = String(chunk.metadata?.content_type || "");

          // Always include exam technique chunks if user selected that option
          if (options.includes("exam_technique") && contentType === "exam_technique") return true;

          // Include specification chunks
          if (contentType === "specification") {
            if (content.includes(specCodeLower)) return true;
            const matchCount = specKeywords.filter((kw: string) => content.includes(kw)).length;
            if (matchCount >= 2) return true;
          }

          // Include paper chunks that mention this topic
          if (contentType.startsWith("paper_")) {
            const matchCount = specKeywords.filter((kw: string) => content.includes(kw)).length;
            if (matchCount >= 2) return true;
          }

          return false;
        });

        if (relevantChunks.length > 0) {
          trainingContext = relevantChunks
            .map((c: { content: string; metadata: Record<string, unknown> }) => {
              const type = String(c.metadata?.content_type || "general").toUpperCase();
              const topic = c.metadata?.topic || "";
              return `[${type}${topic ? ` - ${topic}` : ""}]\n${c.content}`;
            })
            .join("\n\n---\n\n");
        }

        console.log(`Found ${relevantChunks.length}/${chunks.length} relevant chunks`);
      }
    } catch (err) {
      console.error("Error fetching training data:", err);
    }

    // Build the comprehensive prompt
    const boardLabel =
      board === "ocr-cs" ? "OCR A Level Computer Science (H446)" :
      board === "aqa" ? "AQA A Level Economics" :
      board === "edexcel" ? "Edexcel A Level Economics" :
      board;

    let prompt = `You are generating a comprehensive A* revision guide for a student studying ${boardLabel}.

The student has selected spec point **${spec_code}: ${spec_name}**.

Generate a detailed, exam-focused revision guide. Structure it EXACTLY as follows:

## 📘 ${spec_code}: ${spec_name}

### Key Knowledge

Cover EVERY detail of this spec point systematically. This is the most important section. Be thorough - explain every concept, definition, and mechanism that falls under this spec point. Use clear explanations with examples. Structure with sub-headings where appropriate. This should be detailed enough that a student could learn the entire topic from this section alone.

For ${boardLabel}, tailor your explanations to exactly what the exam board expects students to know. Use precise technical language that matches mark scheme expectations.`;

    if (diagram_context) {
      prompt += `\n\n### 📊 Relevant Diagrams\n\nThe following diagrams are available and relevant to this topic. Reference them in your explanation and describe what each diagram shows and how to draw/label it in an exam:\n${diagram_context}`;
    }

    if (options.includes("application")) {
      prompt += `\n\n### 🌍 Real-World Application\n\nProvide real-world examples and case studies that demonstrate this concept in practice. Include current/recent examples where possible.`;
    }

    if (options.includes("exam_technique")) {
      prompt += `\n\n### 🎯 Exam Technique\n\nProvide specific exam technique advice for questions on this topic. Include:
- **Command words**: Explain what each relevant command word means and how to structure answers (e.g., 'Describe' = what happens step by step, 'Explain' = what + why, 'Evaluate/Discuss' = both sides + conclusion)
- **Timing guidance**: How long to spend on different mark questions  
- **Key phrases**: Exact technical phrases that examiners look for in mark schemes
- **Common mistakes**: What students typically get wrong on this topic
- **Mark allocation**: How marks are typically distributed for this type of question
- **Answer structure**: How to structure responses for maximum marks`;
    }

    if (options.includes("past_papers") && past_paper_context) {
      prompt += `\n\n### 📝 Past Paper Questions\n\nHere are real past paper questions that have been asked on this topic. For each question, explain what the examiner is looking for:\n\n${past_paper_context}\n\nFor each question listed above, briefly note:
- What the question is testing
- Key points needed for full marks
- Any traps or common mistakes`;
    }

    prompt += `\n\nIMPORTANT FORMATTING RULES:
- Use clear markdown formatting with ## for main sections and ### for sub-sections
- Use bullet points and numbered lists for clarity
- Bold key terms and definitions
- Keep language precise and exam-focused
- Do NOT include a title - it will be added automatically
- Start directly with the "Key Knowledge" section`;

    // Build system prompt
    let systemPrompt = systemPromptBase || `You are an expert ${boardLabel} tutor creating revision materials.`;
    if (trainingContext) {
      systemPrompt += `\n\n--- TRAINING DATA ---\nUse the following training data to inform your revision guide. Reference specific details from the specification and exam technique guidance:\n\n${trainingContext}`;
    }

    console.log(`Prompt length: ${prompt.length}, System prompt length: ${systemPrompt.length}`);

    // Call Lovable AI (non-streaming)
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`AI gateway error ${response.status}:`, errText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Failed to generate revision guide. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await response.json();
    const content = aiResult.choices?.[0]?.message?.content || "";

    if (!content) {
      return new Response(
        JSON.stringify({ error: "AI returned empty content. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generated guide: ${content.length} chars`);

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Revision guide error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
