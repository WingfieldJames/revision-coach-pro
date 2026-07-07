// A*AI Schools — bespoke materials ingestion.
//
// ⛔ DEFERRED / SCAFFOLDING — NOT wired into the app and NOT registered in
// supabase/config.toml, so it does not deploy. See
// docs/schools-materials-ingestion-plan.md (STATUS: DEFERRED). The MVP reuses the
// existing Edexcel Economics B2C corpus for free in school mode; this function is
// only for a school's OWN uploads (their mark scheme / mock / house style) and is
// here, complete, for when that feature is un-deferred.
//
// Contract: POST { material_id } → chunk + embed the uploaded file into
// document_chunks, scoped to the school. Service-role work; invoked with the
// caller's JWT (default verify_jwt).
//
// COMPLIANCE-CRITICAL: every chunk is inserted with product_id: null. That is the
// structural guard that keeps a school's private material off the B2C retrieval
// path (which filters .eq('product_id', productId)) and away from other schools.
// Never set product_id on a school chunk.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Same chunker as ingest-documents (1000/200, drops tiny chunks).
function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    let end = start + chunkSize;

    if (end < text.length) {
      const lastPeriod = text.lastIndexOf(".", end);
      const lastNewline = text.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1;
      }
    }

    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }

  return chunks.filter((chunk) => chunk.length > 50);
}

// Same embedding call as ingest-documents (Lovable AI gateway).
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: "text-embedding-3-small", input: text }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

// Extract plain text from a downloaded material by file extension.
async function extractText(fileUrl: string, blob: Blob): Promise<string> {
  const ext = fileUrl.toLowerCase().split(".").pop() ?? "";

  if (ext === "txt" || ext === "md") {
    return await blob.text();
  }

  if (ext === "pdf") {
    // unpdf bundles pdfjs for serverless/Deno. Text-layer PDFs only; a scanned
    // (image-only) PDF yields ~empty text and is caught by the empty-text guard.
    const { getDocumentProxy, extractText: extractPdf } = await import("https://esm.sh/unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(await blob.arrayBuffer()));
    const { text } = await extractPdf(pdf, { mergePages: true });
    return typeof text === "string" ? text : Array.isArray(text) ? text.join("\n\n") : "";
  }

  if (ext === "docx") {
    // Isolated so a docx failure never crashes the function — caller treats a
    // thrown/empty result as a soft 'failed'.
    const mammoth = await import("https://esm.sh/mammoth");
    const { value } = await mammoth.extractRawText({ arrayBuffer: await blob.arrayBuffer() });
    return value ?? "";
  }

  throw new Error("unsupported file type");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Mark a material failed and return a 200 (the frontend fires-and-forgets;
  // status is read back off the row on reload).
  const fail = async (materialId: string, reason: string) => {
    console.error(`ingest-school-material ${materialId} failed: ${reason}`);
    await supabase
      .from("school_materials")
      .update({ processing_status: "failed" })
      .eq("id", materialId);
    return json({ ok: false, reason });
  };

  let material_id: string | undefined;
  try {
    ({ material_id } = await req.json());
    if (!material_id) return json({ error: "material_id is required" }, 400);

    const { data: row, error: rowError } = await supabase
      .from("school_materials")
      .select("id, school_id, title, material_type, file_url")
      .eq("id", material_id)
      .maybeSingle();

    if (rowError) throw rowError;
    if (!row) return json({ error: "material not found" }, 404);
    if (!row.file_url) return await fail(material_id, "material has no file_url");

    await supabase
      .from("school_materials")
      .update({ processing_status: "processing" })
      .eq("id", material_id);

    const { data: blob, error: dlError } = await supabase.storage
      .from("school-materials")
      .download(row.file_url);
    if (dlError || !blob) return await fail(material_id, `download failed: ${dlError?.message ?? "no data"}`);

    let text: string;
    try {
      text = await extractText(row.file_url, blob);
    } catch (extractErr) {
      return await fail(material_id, `extraction failed: ${(extractErr as Error).message}`);
    }

    if (!text || !text.trim()) {
      return await fail(material_id, "no extractable text — is this a scanned PDF?");
    }

    // Idempotent re-ingest: clear any prior chunks for this material first.
    try {
      await supabase.from("document_chunks").delete().eq("metadata->>material_id", material_id);
    } catch (delErr) {
      console.error("prior-chunk cleanup skipped:", (delErr as Error).message);
    }

    const chunks = chunkText(text);
    let created = 0;

    for (const chunk of chunks) {
      let embedding: number[] | null = null;
      try {
        embedding = await generateEmbedding(chunk, lovableApiKey);
      } catch (embErr) {
        console.error(`embed failed (inserting null): ${(embErr as Error).message}`);
      }

      const { error: insertError } = await supabase.from("document_chunks").insert({
        product_id: null, // COMPLIANCE: never the product id — keeps school material off B2C.
        content: chunk,
        embedding,
        metadata: {
          content_type: "school_material",
          school_id: row.school_id,
          material_id: row.id,
          material_type: row.material_type,
          title: row.title,
        },
      });

      if (insertError) {
        console.error("chunk insert error:", insertError.message);
      } else {
        created++;
      }
    }

    await supabase
      .from("school_materials")
      .update({ processing_status: "done", chunks_created: created })
      .eq("id", material_id);

    console.log(`ingest-school-material ${material_id}: ${created} chunks`);
    return json({ ok: true, chunks_created: created });
  } catch (error) {
    if (material_id) return await fail(material_id, (error as Error).message);
    return json({ error: (error as Error).message }, 500);
  }
});
