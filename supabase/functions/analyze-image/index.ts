import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { geminiChatRaw } from "../_shared/ai.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "analyze-image"), ...RATE_LIMITS.chat });

    console.log("Authenticated user:", user.id);

    const { image, imageType } = await req.json();

    if (!image) {
      return err("No image provided", 400);
    }

    // Build the system prompt for exact OCR extraction
    let systemPrompt = `You are a precise OCR tool. Your ONLY job is to extract the EXACT text from images character-by-character. Do NOT summarize, interpret, explain, or add any commentary. Output ONLY the text exactly as it appears in the image, preserving:
- Exact wording and spelling
- Line breaks and paragraph structure
- Bullet points and numbering
- Any symbols, numbers, or special characters
- Headers and subheadings

If there are diagrams, describe the labels/text ON the diagram only (axis labels, curve names, annotations). Do not explain what the diagram means.`;

    let userPrompt = `Extract ALL text from this image EXACTLY as written. Do not summarize or interpret - just transcribe the exact characters you see. Preserve the original formatting and structure.`;

    console.log("Sending image for analysis, type:", imageType, "user:", user.id);

    const aiModel = "google/gemini-2.5-flash";

    const data = await geminiChatRaw({
      model: aiModel,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ],
    });

    const extractedText = data.choices?.[0]?.message?.content;

    // Log AI usage
    try {
      const inputTok = data.usage?.prompt_tokens || 0;
      const outputTok = data.usage?.completion_tokens || 0;
      const cost = (inputTok / 1_000_000) * 0.30 + (outputTok / 1_000_000) * 2.50;
      await admin.from("api_usage_logs").insert({
        user_id: user.id, feature: "essay", model: aiModel,
        input_tokens: inputTok, output_tokens: outputTok, estimated_cost_usd: cost,
      });
    } catch (logErr) { console.error("usage log failed:", logErr); }

    if (!extractedText) {
      console.error("No content in response:", data);
      return err("No content extracted from image", 500);
    }

    console.log("Successfully analyzed image for user:", user.id);

    return json({ extractedText });
  } catch (e) {
    return toResponse(e);
  }
});
