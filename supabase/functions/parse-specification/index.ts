import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SPEC_EXTRACTION_PROMPT = `You are a specification extraction expert. Extract ALL specification points from this PDF document.

Return ONLY a JSON object (no markdown, no code fences) in this exact format:
{
  "specifications": [
    "spec point 1",
    "spec point 2",
    "spec point 3"
  ]
}

Rules:
- Each specification point should be a single string describing one learning objective or content point
- Include topic numbers/codes if present (e.g. "3.1.1 Atomic structure: ...")
- Be exhaustive - capture every single specification point in the document
- Preserve the original wording as closely as possible
- Do NOT include section headers as separate points - integrate them into the point text for context`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const { pdf_base64, mime_type } = await req.json();

    if (!pdf_base64) {
      throw new Error("pdf_base64 is required");
    }

    const mimeType = mime_type || "application/pdf";

    console.log("Parsing specification PDF...");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("AI API error:", errText);
      throw new Error(`AI API error: ${resp.status}`);
    }

    const data = await resp.json();
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

    return new Response(
      JSON.stringify(parsed),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse specification error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
