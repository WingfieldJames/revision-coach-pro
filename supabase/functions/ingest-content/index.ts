import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireAdmin } from "../_shared/auth.ts";

interface ContentChunk {
  content: string;
  metadata: {
    content_type: string; // specification | past_paper | mark_scheme | exam_technique | notes
    topic?: string;
    component?: string;
    year?: string;
    paper?: string;
    source?: string;
    [key: string]: unknown;
  };
}

interface IngestRequest {
  product_id: string;
  chunks: ContentChunk[];
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: admin-only one-off ingestion tool. Closes the pre-fix hole where
    // any anonymous caller could inject chunks into the RAG corpus students see.
    const { admin: supabase } = await requireAdmin(req);

    const { product_id, chunks }: IngestRequest = await req.json();

    if (!product_id) {
      return err("product_id is required", 400);
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return err("chunks array is required and must not be empty", 400);
    }

    console.log(`Ingesting ${chunks.length} chunks for product ${product_id}`);

    // Prepare rows for insertion
    const rows = chunks.map(chunk => ({
      product_id,
      content: chunk.content,
      metadata: chunk.metadata,
      // Note: embedding is null for now - can be added later with an embedding provider
    }));

    // Insert in batches of 100
    const batchSize = 100;
    let insertedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("document_chunks")
        .insert(batch);

      if (error) {
        console.error(`Batch ${i / batchSize + 1} error:`, error);
        errors.push(`Batch ${i / batchSize + 1}: ${error.message}`);
      } else {
        insertedCount += batch.length;
        console.log(`Inserted batch ${i / batchSize + 1}: ${batch.length} chunks`);
      }
    }

    return json({
      success: true,
      inserted: insertedCount,
      total: chunks.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (e) {
    return toResponse(e);
  }
});
