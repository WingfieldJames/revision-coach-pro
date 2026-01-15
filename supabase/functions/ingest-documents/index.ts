import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

// Generate embeddings using Lovable AI gateway
async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // This function requires service role key (admin only)
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { documents, product_id } = await req.json();

    if (!documents || !Array.isArray(documents)) {
      throw new Error("documents array is required");
    }

    if (!product_id) {
      throw new Error("product_id is required");
    }

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
          const embedding = await generateEmbedding(chunk, lovableApiKey);

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

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Ingest error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
