import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { optionalUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, ipKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chatCompletion } from "../_shared/ai.ts";

const MAX_CONTEXT_CHARS = 40000;

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // Best-effort auth: the logged-out /free funnel must work anonymously. Logged-in
    // callers are rate-limited by user; anon callers by IP (which now caps anon abuse
    // in place of the per-user monthly limit that only applies to logged-in users).
    const { user, admin: supabaseAdmin } = await optionalUser(req);
    const rlKey = user ? userKey(user.id, "generate-revision-guide") : ipKey(req, "generate-revision-guide");
    await enforceRateLimit(supabaseAdmin, { key: rlKey, ...RATE_LIMITS.chat });

    const userId = user?.id ?? null;

    const {
      product_id,
      spec_code,
      spec_name,
      board,
      subject_name = "",
      options = [],
      past_paper_context = "",
      diagram_context = "",
    } = await req.json();

    if (!spec_name || !product_id) {
      return err("spec_name and product_id are required", 400);
    }

    console.log(`Revision guide for ${board} spec ${spec_code}: ${spec_name}`);

    // --- Subscription check ---
    let tier = "free";
    if (userId && product_id) {
      try {
        const { data: sub } = await supabaseAdmin
          .from("user_subscriptions")
          .select("tier, subscription_end")
          .eq("user_id", userId)
          .eq("product_id", product_id)
          .eq("active", true)
          .maybeSingle();

        if (sub?.tier === "deluxe") {
          if (!sub.subscription_end || new Date(sub.subscription_end) > new Date()) {
            tier = "deluxe";
          }
        }

        if (tier === "free") {
          const { data: prod } = await supabaseAdmin
            .from("products")
            .select("slug")
            .eq("id", product_id)
            .maybeSingle();

          if (prod?.slug === "edexcel-economics") {
            const { data: legacyUser } = await supabaseAdmin
              .from("users")
              .select("is_premium, subscription_end")
              .eq("id", userId)
              .maybeSingle();

            if (legacyUser?.is_premium) {
              if (!legacyUser.subscription_end || new Date(legacyUser.subscription_end) > new Date()) {
                tier = "deluxe";
              }
            }
          }
        }
      } catch (err) {
        console.error("Error verifying subscription:", err);
      }
    }

    console.log(`User ${userId} tier: ${tier}`);

    // --- Free usage limit ---
    if (tier === "free" && userId) {
      const { data: usageData, error: usageError } = await supabaseAdmin.rpc("get_tool_usage", {
        p_user_id: userId,
        p_product_id: product_id,
        p_tool_type: "revision_guide",
      });

      const currentCount = (!usageError && usageData) ? (usageData as { count: number }).count : 0;
      if (currentCount >= 1) {
        return json(
          {
            error: "limit_exceeded",
            message: "You've used your free revision guide this month. Upgrade to Deluxe for unlimited guides!",
          },
          429,
        );
      }
    }

    // --- Fetch system prompt ---
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

    // --- Fetch training data with context cap ---
    let trainingContext = "";
    const specCodeLower = (spec_code || "").toLowerCase();
    const specNameLower = spec_name.toLowerCase();
    const specKeywords = specNameLower.split(/[\s,()]+/).filter((w: string) => w.length > 2);

    try {
      const [specResult, techniqueResult, paperResult] = await Promise.all([
        supabaseAdmin
          .from("document_chunks")
          .select("content, metadata")
          .eq("product_id", product_id)
          .filter("metadata->>content_type", "eq", "specification")
          .limit(50),
        supabaseAdmin
          .from("document_chunks")
          .select("content, metadata")
          .eq("product_id", product_id)
          .filter("metadata->>content_type", "eq", "exam_technique")
          .limit(20),
        supabaseAdmin
          .from("document_chunks")
          .select("content, metadata")
          .eq("product_id", product_id)
          .not("metadata->>content_type", "in", '("specification","exam_technique")')
          .limit(100),
      ]);

      const allChunks = [
        ...(specResult.data || []),
        ...(techniqueResult.data || []),
        ...(paperResult.data || []),
      ];

      // Deduplicate
      const seen = new Set<string>();
      const uniqueChunks = allChunks.filter((c: any) => {
        const key = c.content.slice(0, 100);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Filter relevant
      const relevantChunks = uniqueChunks.filter((chunk: { content: string; metadata: Record<string, unknown> }) => {
        const content = chunk.content.toLowerCase();
        const contentType = String(chunk.metadata?.content_type || "");

        if (options.includes("exam_technique") && contentType === "exam_technique") return true;

        if (contentType === "specification") {
          if (specCodeLower && content.includes(specCodeLower)) return true;
          const matchCount = specKeywords.filter((kw: string) => content.includes(kw)).length;
          if (matchCount >= 2) return true;
        }

        if (contentType.startsWith("paper_") || contentType === "combined" || contentType.includes("question") || contentType.includes("mark_scheme")) {
          const matchCount = specKeywords.filter((kw: string) => content.includes(kw)).length;
          if (matchCount >= 2) return true;
        }

        return false;
      });

      // Edexcel Maths only: spec chunks are stored with a "[Edexcel A-Level Mathematics Specification 9MA0 - X]" header
      // line followed by raw JSON. Strip the bracket header and convert/remove JSON so it doesn't appear verbatim in the guide.
      const isEdexcelMaths = board === "edexcel-maths" || board === "edexcel-maths-applied";
      const cleanEdexcelMathsSpec = (raw: string): string => {
        let s = raw;
        // Remove leading "[...spec header...]" line
        s = s.replace(/^\s*\[[^\]\n]*\]\s*\n?/, "");
        // Remove any standalone JSON object blocks (greedy across lines, balanced enough for our chunks)
        s = s.replace(/\{[\s\S]*?\}\s*/g, (block) => {
          // Try to extract human-readable string values from the JSON; otherwise drop it
          try {
            const obj = JSON.parse(block.trim());
            const lines: string[] = [];
            const walk = (v: any, prefix = "") => {
              if (v == null) return;
              if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
                lines.push(`${prefix}${v}`);
              } else if (Array.isArray(v)) {
                v.forEach((x) => walk(x, prefix));
              } else if (typeof v === "object") {
                for (const k of Object.keys(v)) {
                  walk(v[k], `${k.replace(/_/g, " ")}: `);
                }
              }
            };
            walk(obj);
            return lines.join("\n") + "\n";
          } catch {
            return "";
          }
        });
        return s.trim();
      };

      // Build context with cap
      if (relevantChunks.length > 0) {
        const parts: string[] = [];
        let totalChars = 0;
        for (const c of relevantChunks) {
          const type = String((c as any).metadata?.content_type || "general").toUpperCase();
          const topic = (c as any).metadata?.topic || "";
          let body = c.content;
          if (isEdexcelMaths && type === "SPECIFICATION") {
            body = cleanEdexcelMathsSpec(body);
          }
          const part = `[${type}${topic ? ` - ${topic}` : ""}]\n${body}`;
          if (totalChars + part.length > MAX_CONTEXT_CHARS && parts.length > 0) break;
          parts.push(part);
          totalChars += part.length;
        }
        trainingContext = parts.join("\n\n---\n\n");
      }

      console.log(`Found ${relevantChunks.length} relevant chunks, context: ${trainingContext.length} chars (cap: ${MAX_CONTEXT_CHARS})`);
    } catch (err) {
      console.error("Error fetching training data:", err);
    }

    // --- Server-side diagram fallback ---
    let finalDiagramContext = diagram_context || "";
    if (options.includes("diagrams") && !finalDiagramContext) {
      try {
        const { data: trainerData } = await supabaseAdmin
          .from("trainer_projects")
          .select("diagram_library")
          .eq("product_id", product_id)
          .limit(1);

        if (trainerData?.[0]?.diagram_library) {
          const diagrams = (trainerData[0].diagram_library as any[]).filter(
            (d: any) => (d.title || d.name) && (d.imagePath || d.image_path || d.url)
          );
          if (diagrams.length > 0) {
            finalDiagramContext = diagrams.map((d: any) => {
              const title = d.title || d.name;
              const kw = Array.isArray(d.keywords) && d.keywords.length > 0
                ? ` (keywords: ${d.keywords.join(", ")})`
                : "";
              return `- ${title}${kw}`;
            }).join("\n");
          }
        }
      } catch (err) {
        console.error("Error fetching diagram library:", err);
      }
    }

    // --- Build prompt ---
    const boardLabel =
      board === "ocr-cs" ? "OCR A Level Computer Science (H446)" :
      board === "aqa" ? "AQA A Level Economics" :
      board === "edexcel" ? "Edexcel A Level Economics" :
      board === "edexcel-maths" ? "Edexcel A Level Mathematics (9MA0) – Pure" :
      board === "edexcel-maths-applied" ? "Edexcel A Level Mathematics (9MA0) – Applied (Statistics & Mechanics)" :
      board === "dynamic" ? (subject_name || spec_name) :
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

${finalDiagramContext ? `DIAGRAMS: The following diagrams are available. Insert them INLINE within your explanation where they are relevant - do NOT put them in a separate section. Reference them naturally as you explain concepts. If a diagram helps illustrate a point, mention it right there. Only use diagrams that genuinely help explain the content - if none are relevant, don't force them in.\n\nAvailable diagrams:\n${finalDiagramContext}\n\nWhen referencing a diagram, write: [DIAGRAM: exact diagram title here]\n` : ""}`;

    if (options.includes("application")) {
      prompt += `\n\nAfter the spec point explanation, include a section titled "Real-World Application" (as a ## heading). Provide real-world examples and case studies that demonstrate these concepts in practice.`;
    }

    if (options.includes("exam_technique")) {
      prompt += `\n\nInclude a section titled "Exam Technique" (as a ## heading). Provide specific exam technique advice:
- Command words: what each relevant command word means and how to structure answers
- Timing guidance: how long to spend on different mark questions
- Key phrases examiners look for in mark schemes
- Common mistakes students make on this topic
- How to structure responses for maximum marks`;
    }

    // Server-side past paper retrieval
    let pastPaperContext = past_paper_context;
    if (!pastPaperContext && options.includes("past_papers")) {
      try {
        const { data: paperChunks } = await supabaseAdmin
          .from("document_chunks")
          .select("content, metadata")
          .eq("product_id", product_id)
          .not("metadata->>content_type", "in", '("specification","exam_technique")')
          .limit(200);

        const matchedPapers = (paperChunks || []).filter((chunk: any) => {
          const ct = String(chunk.metadata?.content_type || "");
          if (!ct.includes("paper") && !ct.includes("combined") && !ct.includes("question")) return false;
          const content = chunk.content.toLowerCase();
          return specKeywords.filter((kw: string) => content.includes(kw)).length >= 2;
        }).slice(0, 8);

        if (matchedPapers.length > 0) {
          pastPaperContext = matchedPapers.map((p: any) => {
            const qNum = p.metadata?.question_number || "";
            const marks = p.metadata?.total_marks || "";
            const year = p.metadata?.year || "";
            const paper = p.metadata?.paper_number ? `Paper ${p.metadata.paper_number}` : "";
            return `- **${year} ${paper} Q${qNum}** (${marks} marks): ${p.content.slice(0, 300)}`;
          }).join('\n');
        }
        console.log(`Past paper context: ${matchedPapers.length} matched chunks`);
      } catch (err) {
        console.error("Error fetching past paper context:", err);
      }
    }

    if (options.includes("past_papers") && pastPaperContext) {
      prompt += `\n\nInclude a section titled "Real Past Paper Questions" (as a ## heading). List the following real past paper questions:\n\n${pastPaperContext}\n\nFor each question, note what the examiner is looking for and key points needed for full marks.`;
    }

    if (board === "edexcel-maths" || board === "edexcel-maths-applied") {
      prompt += `\n\nIMPORTANT (Edexcel Maths): The training data may contain bracketed labels like "[Edexcel A-Level Mathematics Specification 9MA0 - ...]" and raw JSON fragments. NEVER copy these into your output. Convert all information into clean prose, sub-headings, and bullet points. The reader must never see square-bracket headers, curly braces, or JSON syntax.`;
    }

    prompt += `\n\nCRITICAL FORMATTING RULES:
- Do NOT include any overall title - it will be added automatically by the system
- Do NOT use emoji anywhere in headings or text
- Use ## for main section headings (like "Exam Technique", "Real Past Paper Questions")
- Use ### for sub-topic headings within the spec explanation (e.g. "### Price Regulation", "### Competition Policy Objectives")
- Do NOT use "**Bold Heading:**" as a substitute for a proper ### sub-heading. If it's a heading, use ###.
- Every heading (## or ###) MUST be followed by at least one paragraph or bullet list of body content — never leave a heading empty
- Separate every block element (heading, paragraph, list, diagram reference) with a blank line
- Use **bold** only for key terms and definitions INSIDE paragraphs, not as standalone headings
- Use indented bullet points for detailed explanations
- Start directly with the first sub-topic of the spec point explanation
- Keep language precise, technical, and exam-focused

WORKED EXAMPLE of correct formatting:

### Price Regulation
Price regulation is a tool used by the CMA to limit how much monopoly firms can charge consumers. The most common approach is **RPI-X** pricing, where firms can increase prices by inflation minus an efficiency factor X.

- The formula forces firms to cut costs to maintain profits
- Used in UK water and energy markets
- Example: Ofwat sets RPI-X for water companies every 5 years

### Objectives of Competition Policy
The main objectives include protecting consumers, promoting efficiency, and preventing abuse of monopoly power.

- **Consumer welfare**: keep prices low and quality high
- **Allocative efficiency**: ensure P = MC
- **Dynamic efficiency**: incentivise innovation through contestability`;

    // Build system prompt
    let systemPrompt = systemPromptBase || `You are an expert ${boardLabel} tutor creating revision materials.`;
    if (trainingContext) {
      systemPrompt += `\n\n--- TRAINING DATA ---\nUse the following training data to inform your revision guide. Reference specific details from the specification and exam technique guidance:\n\n${trainingContext}`;
    }

    console.log(`Prompt length: ${prompt.length}, System prompt length: ${systemPrompt.length}`);

    // --- AI call ---
    const aiModel = "google/gemini-2.5-flash";

    const aiResult = await chatCompletion({
      model: "chat",
      system: systemPrompt,
      messages: [
        { role: "user", content: prompt },
      ],
      maxTokens: 8000,
      logCtx: { admin: supabaseAdmin, fn: "generate-revision-guide", userId },
    });
    const content = aiResult.text || "";

    // Log AI usage
    try {
      const inputTok = aiResult.usage.inputTokens || 0;
      const outputTok = aiResult.usage.outputTokens || 0;
      const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
      await supabaseAdmin.from("api_usage_logs").insert({
        user_id: userId ?? null, product_id: product_id ?? null,
        feature: "revision_guide", model: aiModel,
        input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
      });
    } catch (logErr) { console.error("usage log failed:", logErr); }

    if (!content) {
      return err("AI returned empty content. Please try again.", 500);
    }

    console.log(`Generated guide: ${content.length} chars`);

    // Increment usage
    if (tier === "free" && userId) {
      await supabaseAdmin.rpc("increment_tool_usage", {
        p_user_id: userId,
        p_product_id: product_id,
        p_tool_type: "revision_guide",
        p_limit: 1,
      });
    }

    return json({ content });
  } catch (e) {
    const resp = toResponse(e);
    if (resp.status === 401 || resp.status === 403 || resp.status === 429) return resp;
    console.error("Revision guide error:", e);
    return err("Something went wrong generating your revision guide. Please try again.", 500);
  }
});
