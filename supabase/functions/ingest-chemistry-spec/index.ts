import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AQA Chemistry Product ID
const AQA_CHEMISTRY_PRODUCT_ID = "3e5bf02e-1424-4bb3-88f9-2a9c58798444";

interface SpecNode {
  id: string;
  t: string; // title
  k?: SpecNode[]; // children
  c?: string[]; // content array
  s?: string[]; // skills
  rp?: { n: number; t: string; d: string[] }[]; // required practicals
}

interface SpecData {
  v: string;
  meta: {
    board: string;
    qualification: string[];
    version: string;
  };
  spec: SpecNode;
}

// Recursively extract all specification points
function extractSpecChunks(
  node: SpecNode,
  parentPath: string[] = [],
  section: string = ""
): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];
  
  const currentPath = [...parentPath, node.t];
  
  // Determine section (Physical, Inorganic, Organic chemistry)
  let currentSection = section;
  if (node.t.includes("Physical chemistry")) currentSection = "Physical chemistry";
  else if (node.t.includes("Inorganic chemistry")) currentSection = "Inorganic chemistry";
  else if (node.t.includes("Organic chemistry")) currentSection = "Organic chemistry";
  
  // If this node has content, create a chunk
  if (node.c && node.c.length > 0) {
    let content = `[AQA Chemistry Specification - ${node.id}: ${node.t}]\n\n`;
    content += `Section: ${currentSection || "General"}\n`;
    content += `Topic: ${currentPath.slice(-2).join(" > ")}\n\n`;
    content += "CONTENT:\n";
    content += node.c.join("\n\n");
    
    // Add skills if present
    if (node.s && node.s.length > 0) {
      content += "\n\nSKILLS:\n";
      content += node.s.join(", ");
    }
    
    // Add required practicals if present
    if (node.rp && node.rp.length > 0) {
      content += "\n\nREQUIRED PRACTICALS:\n";
      for (const rp of node.rp) {
        content += `\nPractical ${rp.n}: ${rp.t}\n`;
        if (rp.d && rp.d.length > 0) {
          content += rp.d.join("\n");
        }
      }
    }
    
    chunks.push({
      content: content.trim(),
      metadata: {
        content_type: "specification",
        tier: "free",
        topic: `${node.id} ${node.t}`,
        section: currentSection || "General",
        spec_id: node.id,
        source: "AQA Chemistry 7404/7405 Specification",
      },
    });
  }
  
  // Recursively process children
  if (node.k && node.k.length > 0) {
    for (const child of node.k) {
      chunks.push(...extractSpecChunks(child, currentPath, currentSection));
    }
  }
  
  return chunks;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { spec_data }: { spec_data: SpecData } = await req.json();

    if (!spec_data || !spec_data.spec) {
      throw new Error("spec_data with spec object is required");
    }

    console.log(`Processing AQA Chemistry specification: ${spec_data.v}`);

    // Extract all specification chunks
    const chunks = extractSpecChunks(spec_data.spec);
    
    console.log(`Generated ${chunks.length} specification chunks`);

    // Prepare rows for insertion
    const rows = chunks.map(chunk => ({
      product_id: AQA_CHEMISTRY_PRODUCT_ID,
      content: chunk.content,
      metadata: chunk.metadata,
    }));

    // Insert in batches of 50
    const batchSize = 50;
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
        source: spec_data.v,
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
