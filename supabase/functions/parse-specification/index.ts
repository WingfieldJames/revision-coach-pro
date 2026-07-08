import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { geminiChatRaw, MODELS } from "../_shared/ai.ts";

const SPEC_EXTRACTION_PROMPT = `You are a specification extraction expert. Extract ONLY the actual specification/syllabus learning objectives and content points from this PDF.

Return ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "specifications": [
    "spec point 1",
    "spec point 2",
    "spec point 3"
  ]
}

Rules:
- Extract ONLY testable learning objectives, content points, and syllabus requirements that students need to know
- Include topic numbers/codes if present (e.g. "3.1.1 Atomic structure: ...")
- SKIP and IGNORE all of the following — do NOT include them:
  * Table of contents, page numbers, headers, footers
  * Introductions, forewords, "about this qualification" sections
  * Assessment overview, exam structure, command words, mark scheme guidance
  * Administration info, entry codes, grading info, contact details
  * Copyright notices, acknowledgements, appendices with formulae/data sheets
  * Any meta-information about the specification itself
- Be exhaustive for actual spec content — capture every single testable point
- Preserve the original wording as closely as possible
- Integrate parent topic context into each point (e.g. "Mechanics > Forces: Newton's three laws of motion")`;

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: no product/project scope in the body — restrict to admins.
    await requireAdmin(req);

    const { pdf_base64, mime_type } = await req.json();

    if (!pdf_base64) {
      return err("pdf_base64 is required", 400);
    }

    const mimeType = mime_type || "application/pdf";

    console.log("Parsing specification PDF...");

    // Multimodal (PDF-as-image) request — routed through the vision escape hatch
    // on the shared AI client. Model matches the "chat" alias.
    const data = await geminiChatRaw({
      model: MODELS.chat.model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: SPEC_EXTRACTION_PROMPT },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${pdf_base64}` } },
          ],
        },
      ],
      temperature: 0.1,
    });

    const raw = data.choices?.[0]?.message?.content || "";

    // Parse the JSON from the response
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON object found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    if (!parsed.specifications || !Array.isArray(parsed.specifications)) {
      throw new Error("Invalid response format - missing specifications array");
    }

    console.log(`Extracted ${parsed.specifications.length} specification points`);

    return json(parsed);
  } catch (error) {
    console.error("Parse specification error:", error);
    return toResponse(error);
  }
});
