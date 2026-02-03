import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// OCR Physics Deluxe Product ID
const OCR_PHYSICS_PRODUCT_ID = "ecd5978d-3bf4-4b9c-993f-30b7f3a0f197";

interface QuestionPart {
  l: string; // label like "a", "i", "ii"
  t?: string; // text
  m?: number; // marks
  p?: QuestionPart[]; // nested parts
}

interface QuestionOption {
  k: string; // key like "A", "B", "C", "D"
  t: string; // text
}

interface MarkSchemePart {
  id: string;
  raw: string;
  codes?: string[];
}

interface QuestionItem {
  q: {
    n: number; // question number
    star: boolean; // starred question (extended response)
    t?: string; // question text
    m?: number; // marks
    o?: QuestionOption[]; // MCQ options
    p?: QuestionPart[]; // sub-parts
  };
  ms: {
    parts: MarkSchemePart[];
  };
}

interface PaperData {
  v: string;
  paper: {
    paper_id: string;
    subject: string;
    time_allowed: string;
    total_marks: number;
  };
  mark_scheme: {
    paper_code: string;
    session: string;
  };
  items: QuestionItem[];
}

// Format question parts recursively
function formatQuestionParts(parts: QuestionPart[], indent: string = ""): string {
  if (!parts || parts.length === 0) return "";
  
  let result = "";
  for (const part of parts) {
    if (part.t) {
      const marksText = part.m ? ` [${part.m} mark${part.m > 1 ? 's' : ''}]` : "";
      result += `${indent}(${part.l}) ${part.t}${marksText}\n`;
    }
    if (part.p && part.p.length > 0) {
      result += formatQuestionParts(part.p, indent + "  ");
    }
  }
  return result;
}

// Format MCQ options
function formatMCQOptions(options: QuestionOption[]): string {
  if (!options || options.length === 0) return "";
  return options.map(opt => `${opt.k}) ${opt.t}`).join("\n");
}

// Extract paper number from paper_code (H556/01 -> 1)
function getPaperNumber(paperCode: string): string {
  const match = paperCode.match(/\/0?(\d)$/);
  return match ? match[1] : "1";
}

// Extract year from session (June 2024 -> 2024)
function getYear(session: string): string {
  const match = session.match(/(\d{4})/);
  return match ? match[1] : "2024";
}

// Format a single question into a readable chunk
function formatQuestionChunk(
  item: QuestionItem,
  paperCode: string,
  session: string,
  paperNumber: string
): string {
  const year = getYear(session);
  const questionNum = item.q.n;
  const isStarred = item.q.star ? " *" : "";
  const totalMarks = item.q.m || 0;
  
  let content = `[June ${year} Paper ${paperNumber} - Question ${questionNum}${isStarred}]`;
  if (totalMarks > 0) {
    content += ` [${totalMarks} mark${totalMarks > 1 ? 's' : ''}]`;
  }
  content += "\n\n";
  
  // Question text
  content += "QUESTION:\n";
  if (item.q.t) {
    content += item.q.t + "\n";
  }
  
  // MCQ options
  if (item.q.o && item.q.o.length > 0) {
    content += "\nOPTIONS:\n";
    content += formatMCQOptions(item.q.o) + "\n";
  }
  
  // Sub-parts
  if (item.q.p && item.q.p.length > 0) {
    content += "\nPARTS:\n";
    content += formatQuestionParts(item.q.p);
  }
  
  // Mark scheme
  if (item.ms && item.ms.parts && item.ms.parts.length > 0) {
    content += "\nMARK SCHEME:\n";
    for (const part of item.ms.parts) {
      if (part.raw) {
        content += part.raw + "\n";
      }
      if (part.codes && part.codes.length > 0) {
        content += `Marking codes: ${part.codes.join(", ")}\n`;
      }
    }
  }
  
  return content.trim();
}

// Process a single paper JSON and return chunks
function processPaper(paperData: PaperData): Array<{content: string; metadata: Record<string, unknown>}> {
  const chunks: Array<{content: string; metadata: Record<string, unknown>}> = [];
  
  const paperCode = paperData.mark_scheme?.paper_code || "H556/01";
  const session = paperData.mark_scheme?.session || "June 2024";
  const paperNumber = getPaperNumber(paperCode);
  const year = getYear(session);
  
  for (const item of paperData.items) {
    const content = formatQuestionChunk(item, paperCode, session, paperNumber);
    
    // Calculate total marks for this question
    let totalMarks = item.q.m || 0;
    if (item.q.p) {
      const countMarks = (parts: QuestionPart[]): number => {
        let sum = 0;
        for (const p of parts) {
          if (p.m) sum += p.m;
          if (p.p) sum += countMarks(p.p);
        }
        return sum;
      };
      totalMarks = totalMarks || countMarks(item.q.p);
    }
    
    const metadata = {
      content_type: `paper_${paperNumber}`,
      tier: "deluxe",
      year: year,
      paper: paperNumber,
      paper_code: paperCode,
      question_number: item.q.n,
      marks: totalMarks,
      is_starred: item.q.star,
      source: `${session} Paper ${paperNumber}`,
    };
    
    chunks.push({ content, metadata });
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

    const { paper_data } = await req.json();

    if (!paper_data) {
      throw new Error("paper_data is required");
    }

    console.log(`Processing paper: ${paper_data.mark_scheme?.session} ${paper_data.mark_scheme?.paper_code}`);

    // Process the paper into chunks
    const chunks = processPaper(paper_data);
    
    console.log(`Generated ${chunks.length} chunks`);

    // Prepare rows for insertion
    const rows = chunks.map(chunk => ({
      product_id: OCR_PHYSICS_PRODUCT_ID,
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
        paper: `${paper_data.mark_scheme?.session} ${paper_data.mark_scheme?.paper_code}`,
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
