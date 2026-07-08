import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireOwnedProject } from "../_shared/auth.ts";
import { embed } from "../_shared/ai.ts";

// Simple chunking function - splits text into chunks of roughly equal size
function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = [];
  let start = 0;
  
  while (start < text.length) {
    let end = start + chunkSize;
    
    // Try to break at a sentence boundary
    if (end < text.length) {
      const lastPeriod = text.lastIndexOf('.', end);
      const lastNewline = text.lastIndexOf('\n', end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + chunkSize / 2) {
        end = breakPoint + 1;
      }
    }
    
    chunks.push(text.slice(start, end).trim());
    start = end - overlap;
  }
  
  return chunks.filter(chunk => chunk.length > 50); // Filter out tiny chunks
}

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { documents, product_id } = await req.json();

    if (!documents || !Array.isArray(documents)) {
      return err("documents array is required", 400);
    }

    if (!product_id) {
      return err("product_id is required", 400);
    }

    // AUTH: caller must own/train this product (or be an admin).
    const { admin: supabase } = await requireOwnedProject(req, product_id);

    console.log(`Processing ${documents.length} documents for product ${product_id}`);

    const results = {
      processed: 0,
      chunks_created: 0,
      errors: [] as string[],
    };

    for (const doc of documents) {
      try {
        const content = typeof doc === "string" ? doc : JSON.stringify(doc);
        const chunks = chunkText(content);

        console.log(`Document split into ${chunks.length} chunks`);

        for (const chunk of chunks) {
          const embedding = await embed(chunk);

          const { error: insertError } = await supabase
            .from("document_chunks")
            .insert({
              product_id,
              content: chunk,
              embedding,
              metadata: typeof doc === "object" ? { source: doc.source || "unknown" } : {},
            });

          if (insertError) {
            console.error("Insert error:", insertError);
            results.errors.push(`Insert error: ${insertError.message}`);
          } else {
            results.chunks_created++;
          }
        }

        results.processed++;
      } catch (docError) {
        console.error("Document processing error:", docError);
        results.errors.push(`Doc error: ${docError.message}`);
      }
    }

    console.log(`Completed: ${results.processed} docs, ${results.chunks_created} chunks`);

    return json(results);
  } catch (error) {
    console.error("Ingest error:", error);
    return toResponse(error);
  }
});
