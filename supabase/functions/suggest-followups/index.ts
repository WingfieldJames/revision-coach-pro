import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { chatCompletion, embed } from "../_shared/ai.ts";

interface PEQ {
  label: string;
  paper: string;
  year: string;
  marks?: string;
  topic?: string;
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    let body: { productId?: string; question?: string; answer?: string; specPoint?: string };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { productId, question, answer, specPoint } = body;
    if (!productId || !question || !answer) {
      return err("Missing required fields", 400);
    }

    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "suggest-followups"), ...RATE_LIMITS.chat });

    const [followups, peqs] = await Promise.all([
      generateFollowups(question, answer, specPoint ?? null, { admin, userId: user.id }),
      findRelatedPEQs(admin, productId, question, answer),
    ]);

    return json({ followups, related_peqs: peqs, spec_point: specPoint || null });
  } catch (e) {
    // Auth/rate-limit errors surface their own response; genuine failures here
    // are non-critical (no chips shown), so degrade gracefully to empty.
    const resp = toResponse(e);
    if (resp.status === 401 || resp.status === 403 || resp.status === 429) return resp;
    console.error("suggest-followups error:", e);
    return json({ followups: [], related_peqs: [] });
  }
});

async function generateFollowups(
  question: string,
  answer: string,
  specPoint: string | null,
  logCtx: { admin: SupabaseClient; userId: string },
): Promise<string[]> {
  try {
    const truncatedAnswer = answer.slice(0, 1200);
    const { text } = await chatCompletion({
      model: "chat",
      system:
        'You are an A-Level Edexcel Economics tutor suggesting 3 short follow-up questions a student would naturally ask after reading a tutor\'s answer. Return STRICT JSON only: {"followups":["...","...","..."]}. Each follow-up must be 4–9 words, specific to the topic, and useful for revision. Vary types: one deeper concept, one application/example, one exam-technique or diagram. No numbering, no quotes inside strings.',
      messages: [
        {
          role: "user",
          content: `Spec point (if known): ${specPoint || "unknown"}\n\nStudent question: ${question}\n\nTutor answer (truncated):\n${truncatedAnswer}`,
        },
      ],
      maxTokens: 200,
      logCtx: { admin: logCtx.admin, fn: "suggest-followups", userId: logCtx.userId },
    });
    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    const arr = Array.isArray(parsed?.followups) ? parsed.followups : [];
    return arr
      .filter((s: unknown) => typeof s === "string" && s.length > 4 && s.length < 120)
      .slice(0, 3);
  } catch (err) {
    console.error("followup gen failed:", err);
    return [];
  }
}

async function findRelatedPEQs(
  supabase: SupabaseClient,
  productId: string,
  question: string,
  answer: string,
): Promise<PEQ[]> {
  try {
    // Hybrid retrieval: pgvector semantic candidates scoped to past-paper chunks,
    // with a bounded keyword-style fallback if embedding/RPC fails. Replaces the
    // old .limit(1500) full scan. The content_type set mirrors the JS filter below.
    const PAST_PAPER_TYPES = ["past_paper", "past_paper_qp", "past_paper_ms"];
    let data: Array<{ content: string; metadata: Record<string, unknown> }> | null = null;
    try {
      const queryEmbedding = await embed(`${question} ${answer.slice(0, 800)}`.slice(0, 8000));
      const { data: vec, error: vErr } = await supabase.rpc("match_documents", {
        query_embedding: queryEmbedding,
        match_count: 40,
        filter_product_id: productId,
        filter_content_types: PAST_PAPER_TYPES,
      });
      if (vErr) console.error("match_documents RPC error, using bounded fallback:", vErr.message);
      else data = (vec as Array<{ content: string; metadata: Record<string, unknown> }>) ?? [];
    } catch (embErr) {
      console.error("PEQ embed failed, using bounded fallback:", (embErr as Error).message);
    }
    // Fall back when the vector layer returned NOTHING — embed/RPC failed OR the RPC
    // succeeded but matched 0 rows (the norm today: corpus embeddings are all NULL, so
    // `data` comes back as an empty [] which is truthy and would skip this block).
    if (!data || data.length === 0) {
      const { data: fb, error } = await supabase
        .from("document_chunks")
        .select("content, metadata")
        .eq("product_id", productId)
        .limit(1500);
      if (error || !fb) return [];
      data = fb;
    }

    const text = `${question} ${answer.slice(0, 800)}`.toLowerCase();
    const STOP = new Set([
      "the","a","an","of","to","in","on","is","are","be","and","or","for","with","that","this","what","how","why","when","which","explain","define","describe","analyse","evaluate","discuss","economics","economic","please","give","example","examples","question","questions","mark","marks","help","need","i","my","me","you","your","do","does","can","will","would","should","could","there","their","its","from","as","by","at","it","they","them","not","but","if","so","also","more","than","then","into","over","such","about","may","very","much","some","other","most","may"
    ]);
    const userKeywords = Array.from(
      new Set(
        text
          .replace(/[^a-z0-9\s]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3 && !STOP.has(w))
      )
    );
    if (userKeywords.length === 0) return [];

    const scored: Array<{ chunk: { content: string; metadata: Record<string, unknown> }; score: number }> = [];
    for (const chunk of data) {
      const meta = (chunk.metadata || {}) as Record<string, unknown>;
      const ct = String(meta.content_type || "");
      if (!ct.startsWith("past_paper") && ct !== "past_paper_qp") continue;
      const haystack = (chunk.content + " " + JSON.stringify(meta)).toLowerCase();
      let score = 0;
      for (const kw of userKeywords) {
        if (haystack.includes(kw)) score += 1;
        if (String(meta.topic || "").toLowerCase().includes(kw)) score += 2;
      }
      if (score > 0) scored.push({ chunk, score });
    }

    scored.sort((a, b) => b.score - a.score);
    const seen = new Set<string>();
    const results: PEQ[] = [];
    for (const { chunk } of scored) {
      const meta = chunk.metadata as Record<string, unknown>;
      const year = String(meta.year || "");
      const paper = String(meta.paper_number || meta.paper || "");
      const qNum = String(meta.question_number || meta.q_num || meta.qNum || "");
      const marks = String(meta.marks || "");
      const topic = String(meta.topic || "");
      const key = `${year}|${paper}|${qNum}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const labelParts: string[] = [];
      if (year) labelParts.push(year);
      if (paper) labelParts.push(`Paper ${paper.replace(/^paper\s*/i, "")}`);
      if (qNum) labelParts.push(`Q${qNum.replace(/^q/i, "")}`);
      if (marks) labelParts.push(`(${marks} marks)`);
      const label = labelParts.join(" ") || (topic ? `PEQ — ${topic}` : "Past paper question");
      results.push({ label, paper, year, marks, topic });
      if (results.length >= 2) break;
    }
    return results;
  } catch (err) {
    console.error("PEQ lookup failed:", err);
    return [];
  }
}
