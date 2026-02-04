import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AQA Chemistry Product ID
const AQA_CHEMISTRY_PRODUCT_ID = "3e5bf02e-1424-4bb3-88f9-2a9c58798444";

interface QuestionPart {
  id?: number[];
  t: string; // text
  m?: number; // marks
}

interface QuestionOption {
  k: string; // key like "A", "B", "C", "D"
  t: string; // text
}

interface Question {
  n: number; // question number
  t?: string; // question text
  m?: number; // marks
  o?: QuestionOption[]; // MCQ options
  p?: QuestionPart[]; // sub-parts
}

interface PaperData {
  v: string;
  paper: {
    subject: string;
    paper_code: string;
    paper_name: string;
    date_session: string;
    time_allowed: string;
  };
  questions: Question[];
}

// Extract paper number from paper_code (7405/2 -> 2)
function getPaperNumber(paperCode: string): string {
  const match = paperCode.match(/\/(\d)$/);
  return match ? match[1] : "1";
}

// Extract year from date_session (Tuesday 18 June 2024 Morning -> 2024)
function getYear(dateSession: string): string {
  const match = dateSession.match(/(\d{4})/);
  return match ? match[1] : "2024";
}

// Format MCQ options
function formatMCQOptions(options: QuestionOption[]): string {
  if (!options || options.length === 0) return "";
  return options.map(opt => `${opt.k}) ${opt.t}`).join("\n");
}

// Format question parts
function formatQuestionParts(parts: QuestionPart[]): string {
  if (!parts || parts.length === 0) return "";
  let result = "";
  for (const part of parts) {
    const marksText = part.m ? ` [${part.m} mark${part.m > 1 ? 's' : ''}]` : "";
    result += `${part.t}${marksText}\n\n`;
  }
  return result;
}

// Format a single question into a readable chunk
function formatQuestionChunk(
  question: Question,
  paperCode: string,
  dateSession: string
): string {
  const year = getYear(dateSession);
  const paperNumber = getPaperNumber(paperCode);
  const questionNum = question.n + 1; // n is 0-indexed
  
  let content = `[AQA Chemistry June ${year} Paper ${paperNumber} - Question ${questionNum}]`;
  if (question.m && question.m > 0) {
    content += ` [${question.m} marks]`;
  }
  content += "\n\n";
  
  // Question text
  if (question.t) {
    content += "QUESTION:\n";
    content += question.t + "\n\n";
  }
  
  // MCQ options
  if (question.o && question.o.length > 0) {
    content += "OPTIONS:\n";
    content += formatMCQOptions(question.o) + "\n\n";
  }
  
  // Sub-parts
  if (question.p && question.p.length > 0) {
    content += "PARTS:\n";
    content += formatQuestionParts(question.p);
  }
  
  return content.trim();
}

// Process a single paper JSON and return chunks
function processPaper(
  paperData: PaperData,
  tier: string
): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];
  
  const paperCode = paperData.paper?.paper_code || "7405/2";
  const dateSession = paperData.paper?.date_session || "June 2024";
  const paperNumber = getPaperNumber(paperCode);
  const year = getYear(dateSession);
  
  for (const question of paperData.questions) {
    const content = formatQuestionChunk(question, paperCode, dateSession);
    
    // Skip empty content
    if (content.length < 50) continue;
    
    const metadata = {
      content_type: "past_paper",
      tier: tier,
      year: year,
      paper: paperNumber,
      paper_code: paperCode,
      question_number: question.n + 1,
      marks: question.m || 0,
      source: `AQA Chemistry June ${year} Paper ${paperNumber}`,
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

    const { paper_data, tier = "free" }: { paper_data: PaperData; tier?: string } = await req.json();

    if (!paper_data) {
      throw new Error("paper_data is required");
    }

    console.log(`Processing paper: ${paper_data.paper?.date_session} ${paper_data.paper?.paper_code} (tier: ${tier})`);

    // Process the paper into chunks
    const chunks = processPaper(paper_data, tier);
    
    console.log(`Generated ${chunks.length} question chunks`);

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
        paper: `${paper_data.paper?.date_session} ${paper_data.paper?.paper_code}`,
        tier: tier,
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
