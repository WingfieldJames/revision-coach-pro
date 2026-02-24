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

    // Tool usage limit for free users (2 per month) - check BEFORE action
    if (tier === "free" && user_id) {
      const { data: usageData, error: usageError } = await supabaseAdmin.rpc("get_tool_usage", {
        p_user_id: user_id,
        p_product_id: product_id,
        p_tool_type: "revision_guide",
      });

      const currentCount = (!usageError && usageData) ? (usageData as { count: number }).count : 0;
      if (currentCount >= 1) {
        return new Response(
          JSON.stringify({
            error: "limit_exceeded",
            message: "You've used your free revision guide this month. Upgrade to Deluxe for unlimited guides!",
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
      board === "edexcel-maths" ? "Edexcel A Level Mathematics (9MA0) – Pure" :
      board === "edexcel-maths-applied" ? "Edexcel A Level Mathematics (9MA0) – Applied (Statistics & Mechanics)" :
      board === "dynamic" ? spec_name :
      board;

    let prompt = `You are generating a comprehensive A* revision guide for a student studying ${boardLabel}.

The student has selected spec point **${spec_code}: ${spec_name}**.

Generate a detailed, exam-focused revision guide. Structure it EXACTLY as follows:

Start with the spec point content. Break it down into logical sub-topics with clear bold sub-headings. For example, if the spec point covers "traversal methods", create separate sub-headings for "Pre-order Traversal", "In-order Traversal", "Post-order Traversal" etc.

For each sub-topic:
- Explain every concept, definition, and mechanism thoroughly
- Use precise technical language that matches ${boardLabel} mark scheme expectations
- Include examples where helpful
- Use indented bullet points for detail

${diagram_context ? `DIAGRAMS: The following diagrams are available. Insert them INLINE within your explanation where they are relevant - do NOT put them in a separate section. Reference them naturally as you explain concepts. If a diagram helps illustrate a point, mention it right there. Only use diagrams that genuinely help explain the content - if none are relevant, don't force them in.\n\nAvailable diagrams:\n${diagram_context}\n\nWhen referencing a diagram, write: [DIAGRAM: exact diagram title here]\n` : ""}`;

    if (options.includes("application")) {
      prompt += `\n\nAfter the spec point explanation, include a section titled "Real-World Application" (as a ## heading). Provide real-world examples and case studies that demonstrate these concepts in practice.`;
    }

    if (options.includes("exam_technique")) {
      prompt += `\n\nInclude a section titled "Exam Technique" (as a ## heading). Provide specific exam technique advice:
- Command words: what each relevant command word means and how to structure answers (e.g., 'Describe' = what happens step by step, 'Explain' = what + why, 'Evaluate/Discuss' = both sides + conclusion)
- Timing guidance: how long to spend on different mark questions
- Key phrases examiners look for in mark schemes
- Common mistakes students make on this topic
- How to structure responses for maximum marks`;
    }

    if (options.includes("past_papers") && past_paper_context) {
      prompt += `\n\nInclude a section titled "Real Past Paper Questions" (as a ## heading). List the following real past paper questions:\n\n${past_paper_context}\n\nFor each question, note what the examiner is looking for and key points needed for full marks.`;
    }

    prompt += `\n\nCRITICAL FORMATTING RULES:
- Do NOT include any overall title - it will be added automatically by the system
- Do NOT use emoji anywhere in headings or text
- Use ## for main section headings (like "Exam Technique", "Real Past Paper Questions")
- Use ### for sub-topic headings within the spec explanation
- Use bold for key terms and definitions
- Use indented bullet points for detailed explanations
- Leave clear spacing between different sections
- Start directly with the first sub-topic of the spec point explanation
- Keep language precise, technical, and exam-focused`;

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
        max_tokens: 8000,
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

    // Increment usage AFTER successful generation
    if (tier === "free" && user_id) {
      await supabaseAdmin.rpc("increment_tool_usage", {
        p_user_id: user_id,
        p_product_id: product_id,
        p_tool_type: "revision_guide",
        p_limit: 1,
      });
    }

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
