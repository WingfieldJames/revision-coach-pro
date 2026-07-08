import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";
import { chatCompletion } from "../_shared/ai.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: admin-only analytics sweep across every product.
    const { user, admin: supabase } = await requireAdmin(req);

    // Fetch all products
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, subject, slug");

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    const allGaps: Record<string, unknown>[] = [];

    for (const product of products ?? []) {
      // Fetch the last 200 student questions for this product
      const { data: messages, error: messagesError } = await supabase
        .from("chat_messages")
        .select(
          "content, chat_conversations!inner(product_id)"
        )
        .eq("role", "user")
        .eq("chat_conversations.product_id", product.id)
        .order("created_at", { ascending: false })
        .limit(200);

      if (messagesError) {
        console.error(
          `Failed to fetch messages for product ${product.name}: ${messagesError.message}`
        );
        continue;
      }

      // Fetch topics covered in document_chunks for this product
      const { data: chunks, error: chunksError } = await supabase
        .from("document_chunks")
        .select("content, metadata")
        .eq("product_id", product.id)
        .limit(500);

      if (chunksError) {
        console.error(
          `Failed to fetch chunks for product ${product.name}: ${chunksError.message}`
        );
        continue;
      }

      // Extract topic summaries from chunks
      const coveredTopics = (chunks ?? []).map((chunk) => {
        const meta = chunk.metadata as Record<string, unknown> | null;
        const topic = meta?.topic ?? meta?.title ?? meta?.heading ?? null;
        if (topic) return String(topic);
        // Fall back to first 120 chars of content as a topic hint
        return (chunk.content ?? "").slice(0, 120);
      });

      const studentQuestions = (messages ?? []).map((m) => m.content);

      if (studentQuestions.length === 0) {
        console.log(`No student questions for product ${product.name}, skipping.`);
        continue;
      }

      // Call the shared AI client to detect content gaps
      let rawContent: string;
      try {
        const result = await chatCompletion({
          model: "chat",
          system: `You are an expert curriculum analyst for UK students. You will be given a list of student questions and a list of topics that already have training data. Your job is to identify the top 5 topics that students are frequently asking about but have little or no coverage in the existing training data.

Return ONLY a JSON array of objects, each with:
- "topic": a concise topic name
- "description": a one-sentence explanation of the gap
- "frequency": estimated relative frequency (high, medium, low) based on how often students ask about it
- "sample_questions": up to 3 example student questions related to this gap

Do not include any text outside the JSON array.`,
          messages: [
            {
              role: "user",
              content: `Product: ${product.name} (${product.subject})

Student questions (last 200):
${studentQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}

Topics with existing training data:
${coveredTopics.map((t, i) => `${i + 1}. ${t}`).join("\n")}

Identify the top 5 content gaps.`,
            },
          ],
          maxTokens: 2048,
          logCtx: { admin: supabase, fn: "detect-content-gaps", userId: user.id },
        });
        rawContent = result.text || "[]";
      } catch (aiErr) {
        console.error(
          `AI request failed for product ${product.name}: ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`
        );
        continue;
      }

      // Parse the AI response – strip markdown fences if present
      let gaps: unknown[];
      try {
        const cleaned = rawContent
          .replace(/```json\s*/gi, "")
          .replace(/```\s*/g, "")
          .trim();
        gaps = JSON.parse(cleaned);
      } catch {
        console.error(
          `Failed to parse AI response for product ${product.name}: ${rawContent}`
        );
        gaps = [];
      }

      // Upsert into content_gaps table (unique on product_id)
      const { error: upsertError } = await supabase
        .from("content_gaps")
        .upsert(
          {
            product_id: product.id,
            gaps,
            analyzed_at: new Date().toISOString(),
          },
          { onConflict: "product_id" }
        );

      if (upsertError) {
        console.error(
          `Failed to upsert gaps for product ${product.name}: ${upsertError.message}`
        );
        continue;
      }

      allGaps.push({
        product_id: product.id,
        product_name: product.name,
        subject: product.subject,
        gaps,
      });
    }

    return json({ success: true, results: allGaps });
  } catch (error) {
    console.error("detect-content-gaps error:", error);
    return toResponse(error);
  }
});
