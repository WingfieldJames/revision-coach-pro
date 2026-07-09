import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireCronSecret } from "../_shared/auth.ts";
import { embed } from "../_shared/ai.ts";

// One-off backfill of document_chunks.embedding. The corpus was ingested without
// embeddings (all NULL), so pgvector `match_documents` matched nothing and the
// "hybrid" RAG was keyword-only. This populates embeddings (OpenAI text-embedding-
// 3-small, 1536-dim — matches the vector(1536) column) so semantic retrieval works.
//
// Bounded per invocation to stay under the ~150s function wall-clock, and safe to call
// repeatedly: it always picks up chunks that are still NULL. Auth = cron secret /
// service-role bearer (requireCronSecret). Invoke in a loop until {"done":true}.
//
// Body (all optional): { limit?: number (<=250, default 100), productId?: uuid }

const PER_CALL_DEFAULT = 100;
const EMBED_CONCURRENCY = 10; // parallel embeds per round (mirrors deploy-subject)

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const admin = requireCronSecret(req);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const limit = Math.min(Math.max(Number(body.limit) || PER_CALL_DEFAULT, 1), 250);
    const productId = typeof body.productId === "string" ? body.productId : null;

    let sel = admin
      .from("document_chunks")
      .select("id, content")
      .is("embedding", null)
      .limit(limit);
    if (productId) sel = sel.eq("product_id", productId);

    const { data: chunks, error } = await sel;
    if (error) return err(`fetch failed: ${error.message}`, 500);
    if (!chunks || chunks.length === 0) {
      return json({ processed: 0, failed: 0, remaining: 0, done: true });
    }

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < chunks.length; i += EMBED_CONCURRENCY) {
      const slice = chunks.slice(i, i + EMBED_CONCURRENCY);
      const results = await Promise.all(
        slice.map(async (c: { id: string; content: string | null }) => {
          try {
            const text = (c.content ?? "").slice(0, 8000).trim() || " ";
            const vec = await embed(text);
            return { id: c.id, vec };
          } catch (e) {
            console.error("embed failed", c.id, (e as Error).message);
            return { id: c.id, vec: null as number[] | null };
          }
        }),
      );
      for (const r of results) {
        if (!r.vec) {
          failed++;
          continue;
        }
        const { error: uErr } = await admin
          .from("document_chunks")
          .update({ embedding: r.vec })
          .eq("id", r.id);
        if (uErr) {
          failed++;
          console.error("update failed", r.id, uErr.message);
        } else {
          processed++;
        }
      }
    }

    let rq = admin
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .is("embedding", null);
    if (productId) rq = rq.eq("product_id", productId);
    const { count: remaining } = await rq;

    return json({
      processed,
      failed,
      remaining: remaining ?? null,
      done: (remaining ?? 1) === 0,
    });
  } catch (e) {
    return toResponse(e);
  }
});
