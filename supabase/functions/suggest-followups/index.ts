import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PEQ {
  label: string;
  paper: string;
  year: string;
  marks?: string;
  topic?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { productId, question, answer, specPoint } = await req.json();
    if (!productId || !question || !answer) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Run AI follow-ups + PEQ lookup in parallel
    const [followups, peqs] = await Promise.all([
      generateFollowups(lovableApiKey, question, answer, specPoint),
      findRelatedPEQs(supabase, productId, question, answer),
    ]);

    return new Response(
      JSON.stringify({ followups, related_peqs: peqs, spec_point: specPoint || null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("suggest-followups error:", err);
    return new Response(JSON.stringify({ followups: [], related_peqs: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function generateFollowups(
  apiKey: string | undefined,
  question: string,
  answer: string,
  specPoint: string | null
): Promise<string[]> {
  if (!apiKey) return [];
  try {
    const truncatedAnswer = answer.slice(0, 1200);
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content:
              "You are an A-Level Edexcel Economics tutor suggesting 3 short follow-up questions a student would naturally ask after reading a tutor's answer. Return STRICT JSON only: {\"followups\":[\"...\",\"...\",\"...\"]}. Each follow-up must be 4–9 words, specific to the topic, and useful for revision. Vary types: one deeper concept, one application/example, one exam-technique or diagram. No numbering, no quotes inside strings.",
          },
          {
            role: "user",
            content: `Spec point (if known): ${specPoint || "unknown"}\n\nStudent question: ${question}\n\nTutor answer (truncated):\n${truncatedAnswer}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });
    if (!res.ok) {
      console.error("Gateway error:", res.status, await res.text());
      return [];
    }
    const data = await res.json();
    const text: string = data?.choices?.[0]?.message?.content || "";
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
  supabase: ReturnType<typeof createClient>,
  productId: string,
  question: string,
  answer: string
): Promise<PEQ[]> {
  try {
    const { data, error } = await supabase
      .from("document_chunks")
      .select("content, metadata")
      .eq("product_id", productId)
      .limit(1500);
    if (error || !data) return [];

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
