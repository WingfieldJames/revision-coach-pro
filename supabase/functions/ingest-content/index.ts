import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { product_id, chunks }: IngestRequest = await req.json();

    if (!product_id) {
      throw new Error("product_id is required");
    }

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      throw new Error("chunks array is required and must not be empty");
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

    return new Response(
      JSON.stringify({
        success: true,
        inserted: insertedCount,
        total: chunks.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Ingest error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
