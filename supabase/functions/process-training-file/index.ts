import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Prompt builders ---

function buildClassificationPrompt(): string {
  return `You are a document classification expert. You handle exam papers from ANY exam board worldwide (AQA, OCR, Edexcel/Pearson, CIE/CAIE, WJEC, IB, SQA, etc.) and ANY subject.

Analyze this document carefully — look at the title page, headers, watermarks, question formatting, and content.

Determine:
1. Is it a Question Paper (QP) or a Mark Scheme (MS)?
   - QP: Contains questions students must answer (may have MCQs, short answer, essay questions, data response, etc.)
   - MS: Contains answers, mark allocations, level descriptors, examiner guidance, acceptable/reject answers
2. What paper number is it? (e.g. Paper 1, Paper 2, Paper 3, Component 1, Unit 1, etc.)
   - Look for codes like "Paper 1", "P1", "Component 01", "Unit 1", "7182/1", "H556/01", "9EC0/01"
   - If no paper number is evident, default to 1

Return ONLY a JSON object (no markdown, no code fences):
{
  "doc_type": "qp" or "ms",
  "paper_number": 1 or 2 or 3 etc,
  "confidence": "high" or "medium" or "low"
}`;
}

function buildQPExtractionPrompt(year: string, subject: string, examBoard: string): string {
  return `You are a universal exam paper extraction expert. You can handle Question Papers from ANY exam board (AQA, OCR, Edexcel/Pearson, CIE/CAIE, WJEC, IB, SQA, etc.) and ANY subject (Sciences, Maths, Humanities, Languages, etc.).

Different boards structure their papers very differently:
- Some use numbered sections (Section A, B, C) — detect and preserve these
- Some use "0 1", "0 2" style numbering (AQA) — normalize to "1", "2" etc.
- Some have MCQ sections followed by written sections (OCR Physics) — capture both
- Some embed stimulus material, extracts, data, graphs, or case studies before questions — capture these
- Some have "answer booklet" style with spaces between questions — ignore the spaces
- Some use lettered sub-parts (a)(b)(c), others use Roman numerals (i)(ii)(iii), others use both — preserve the original scheme
- Some have "choose one from" optional questions — note this

CRITICAL RULES:
- Process the paper PAGE BY PAGE from start to finish. Do not skip any page.
- Question numbers MUST follow the paper's own numbering scheme exactly
- Each question's text must be the COMPLETE verbatim wording — never summarize or truncate
- For MCQs, include the full stem AND all options (A, B, C, D) with exact wording
- Extract EVERY question and sub-part in the EXACT order they appear
- Include ALL marks for each question/sub-part (shown in brackets like [4] or [4 marks])
- Include ANY stimulus material, extracts, data tables, figure descriptions, or context given WITH or BEFORE the question
- Do NOT skip any questions, even if they seem repetitive or simple
- Do NOT reorder questions — maintain the original paper order
- For questions referencing figures/graphs/diagrams, describe what the figure shows as best you can

SKIP/IGNORE:
- Cover page boilerplate instructions ("Answer ALL questions", "Write in black ink", candidate details)
- Blank/lined answer pages, formula sheets, periodic tables, data booklets
- Page numbers, headers, footers, copyright notices, barcodes

Output as a SINGLE JSON object:
{
  "question_count": <total number of individual questions/sub-parts extracted>,
  "papers": [
    {
      "exam_board": "${examBoard}",
      "qualification": "Detected from paper header",
      "series": "June ${year}",
      "paper_code": "The paper code from the header (e.g. 9EC0/03, 7405/2, H446/01, 7182/1)",
      "paper": "June ${year} Paper [number]",
      "total_marks": <total marks for the paper>,
      "sections": [
        {
          "name": "Section A",
          "total_marks": <section marks if stated>,
          "notes": "Any section-level instructions",
          "context": {
            "figures": ["Description of any figures/diagrams provided for this section"],
            "extracts": ["Full text of any extracts/data provided for this section"]
          },
          "questions": [
            {
              "number": "1(a)",
              "question": "The COMPLETE question text exactly as written.",
              "marks": 5,
              "year": ${year},
              "paper": "June ${year} Paper [number]",
              "extract": "If this question references specific data/extracts/figures, describe them here. Otherwise null.",
              "mark_scheme": null
            }
          ]
        }
      ]
    }
  ]
}

IMPORTANT:
- If the paper has no explicit sections, use a single section with name "Full Paper"
- Detect the paper code, total marks, and qualification from the paper header
- Subject: ${subject}, Board: ${examBoard}, Year: ${year}
- Be EXHAUSTIVE — every question must be captured with complete text and correct marks.`;
}

function buildMSExtractionPrompt(year: string, subject: string, examBoard: string): string {
  return `You are a mark scheme extraction expert. Extract the COMPLETE mark scheme for every question.

CRITICAL RULES — READ CAREFULLY:
- Process the mark scheme PAGE BY PAGE from start to finish. Do not skip any page.
- Question numbers MUST follow the paper's numbering scheme exactly — match the question paper numbering (1(a), 1(b)(i), etc.)
- Extract mark scheme for EVERY question in the EXACT order they appear
- Include ALL sub-parts matching the question paper numbering
- Include the correct answers and ALL acceptable alternative answers
- Include mark codes (M1, A1, B1, AO1, AO2, AO3 etc.) and what earns each mark
- Include examiner guidance, "Accept/Reject" clarifications
- Include required working or method steps
- For extended response questions, include level descriptors (Level 1, 2, 3 etc.) with mark ranges
- Include indicative content students should include
- Each question's mark scheme text must be COMPLETE — never summarize or truncate

SKIP/IGNORE:
- Cover page, administrative headers, "Mark Scheme" title pages
- General marking instructions that appear at the start
- Copyright notices, page numbers, blank pages
- Generic rubric about how to use the mark scheme

Output as a JSON object:
{
  "question_count": <total number of individual questions/sub-parts extracted>,
  "marks": [
    {
      "question_number": "1(a)",
      "mark_scheme": "The COMPLETE marking points, acceptable answers, mark codes, level descriptors, and examiner guidance",
      "total_marks": 6,
      "topic": "Topic this question covers"
    }
  ]
}

Subject: ${subject}, Board: ${examBoard}, Year: ${year}
Be EXHAUSTIVE — capture every question's marking points, level descriptors, and examiner guidance.`;
}

function buildSpecificationPrompt(): string {
  return `You are a document extraction expert. Extract ALL specification points, topics, and sub-topics from this document.

Output as a JSON array of objects, each representing one topic or sub-topic:
[
  {
    "topic": "Topic name",
    "subtopic": "Sub-topic name or null",
    "content": "Full specification content for this point",
    "content_type": "specification"
  }
]

Be exhaustive - capture every single specification point. Include topic numbers/codes if present.`;
}

function buildGenericPrompt(sectionType: string): string {
  return `Extract all relevant content from this document and structure it as a JSON array of chunks:
[
  {
    "content": "The extracted content",
    "topic": "Topic or section name",
    "content_type": "${sectionType}"
  }
]`;
}

// --- AI call helper ---

async function callAI(
  lovableApiKey: string,
  prompt: string,
  base64: string,
  mimeType: string,
  temperature = 0.1,
  model = "google/gemini-2.5-flash",
): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64}` } },
          ],
        },
      ],
      temperature,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`AI_ERROR:${resp.status}:${errText}`);
  }

  const data = await resp.json();
  return data.choices?.[0]?.message?.content || "";
}

function parseJSONArray(raw: string): Array<Record<string, unknown>> {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error("No JSON array found in AI response");
  return JSON.parse(match[0]);
}

function parseJSONObject(raw: string): Record<string, unknown> {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON object found in AI response");
  return JSON.parse(match[0]);
}

// --- Validation helper ---

interface ValidationResult {
  valid: boolean;
  issues: string[];
  questionCount: number;
}

function validateExtraction(chunks: Array<Record<string, unknown>>, docType: string): ValidationResult {
  const issues: string[] = [];
  const questionCount = chunks.length;

  if (questionCount === 0) {
    issues.push("No questions were extracted");
    return { valid: false, issues, questionCount };
  }

  // Check for suspiciously short question text
  for (const chunk of chunks) {
    const text = docType === "qp"
      ? String(chunk.question_text || "")
      : String(chunk.mark_scheme || "");
    const qNum = String(chunk.question_number || "");

    if (text.length < 20 && text.length > 0) {
      issues.push(`Question ${qNum}: text suspiciously short (${text.length} chars): "${text}"`);
    }
    if (!qNum) {
      issues.push("Found a question with no question number");
    }
  }

  // Check sequential numbering (basic check - first character should be roughly sequential)
  const numbers = chunks.map(c => String(c.question_number || ""));
  const mainNumbers = numbers.map(n => parseInt(n.replace(/[^0-9]/g, ""))).filter(n => !isNaN(n));
  if (mainNumbers.length > 1) {
    let lastMain = mainNumbers[0];
    for (let i = 1; i < mainNumbers.length; i++) {
      // Allow same number (sub-parts) or next number, but flag big gaps
      if (mainNumbers[i] > lastMain + 5) {
        issues.push(`Possible gap in numbering: jumped from question ~${lastMain} to ~${mainNumbers[i]}`);
      }
      if (mainNumbers[i] >= lastMain) {
        lastMain = mainNumbers[i];
      }
    }
  }

  return {
    valid: issues.length === 0,
    issues,
    questionCount,
  };
}

// --- Embedding helper ---

async function generateEmbedding(lovableApiKey: string, content: string): Promise<number[] | null> {
  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: content }),
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.data?.[0]?.embedding || null;
  } catch {
    return null;
  }
}

// --- Merge logic ---

async function attemptMerge(
  supabase: ReturnType<typeof createClient>,
  lovableApiKey: string,
  projectId: string,
  year: string,
  paperNumber: number,
  currentDocType: string,
  currentUploadId: string,
  productId: string,
) {
  const oppositeType = currentDocType === "qp" ? "ms" : "qp";

  // Find the counterpart upload
  const { data: counterparts } = await supabase
    .from("trainer_uploads")
    .select("id, doc_type, paper_number")
    .eq("project_id", projectId)
    .eq("year", year)
    .eq("paper_number", paperNumber)
    .eq("doc_type", oppositeType)
    .eq("processing_status", "done");

  if (!counterparts || counterparts.length === 0) {
    console.log(`No counterpart ${oppositeType} found for paper ${paperNumber} ${year}. Waiting.`);
    return 0;
  }

  const counterpartId = counterparts[0].id;
  const qpUploadId = currentDocType === "qp" ? currentUploadId : counterpartId;
  const msUploadId = currentDocType === "ms" ? currentUploadId : counterpartId;

  console.log(`Found counterpart! Merging QP(${qpUploadId}) + MS(${msUploadId}) for Paper ${paperNumber} ${year}`);

  // Fetch QP chunks
  const { data: qpChunks } = await supabase
    .from("document_chunks")
    .select("id, content, metadata")
    .eq("product_id", productId)
    .contains("metadata", { upload_id: qpUploadId });

  // Fetch MS chunks
  const { data: msChunks } = await supabase
    .from("document_chunks")
    .select("id, content, metadata")
    .eq("product_id", productId)
    .contains("metadata", { upload_id: msUploadId });

  if (!qpChunks?.length || !msChunks?.length) {
    console.log("Missing chunks for merge - QP:", qpChunks?.length, "MS:", msChunks?.length);
    return 0;
  }

  // Build lookup by question number from MS chunks
  const msLookup = new Map<string, { content: string; metadata: Record<string, unknown> }>();
  for (const chunk of msChunks) {
    const qNum = (chunk.metadata as Record<string, unknown>)?.question_number;
    if (qNum) msLookup.set(String(qNum), chunk);
  }

  let mergedCount = 0;
  const idsToDelete: string[] = [];

  for (const qpChunk of qpChunks) {
    const qNum = (qpChunk.metadata as Record<string, unknown>)?.question_number;
    if (!qNum) continue;

    const msChunk = msLookup.get(String(qNum));
    idsToDelete.push(qpChunk.id);

    // Build combined content
    const qpContent = qpChunk.content;
    const msContent = msChunk
      ? (msChunk.metadata as Record<string, unknown>)?.mark_scheme_text as string || msChunk.content
      : "Mark scheme not available";
    const totalMarks = (qpChunk.metadata as Record<string, unknown>)?.total_marks ||
      (msChunk?.metadata as Record<string, unknown>)?.total_marks || "unknown";

    const combined = `Question ${qNum}: ${qpContent}\n\nMark Scheme: ${msContent}\n\nTotal Marks: ${totalMarks}`;

    if (msChunk) idsToDelete.push(msChunk.id);

    // Generate embedding for combined chunk
    const embedding = await generateEmbedding(lovableApiKey, combined);

    const { error: insertErr } = await supabase.from("document_chunks").insert({
      product_id: productId,
      content: combined,
      embedding,
      metadata: {
        content_type: "past_paper",
        topic: (qpChunk.metadata as Record<string, unknown>)?.topic || "",
        question_number: String(qNum),
        total_marks: totalMarks,
        year,
        paper_number: paperNumber,
        merged: true,
        source_qp_upload: qpUploadId,
        source_ms_upload: msUploadId,
      },
    });

    if (!insertErr) mergedCount++;
  }

  // Also collect any MS chunks not matched
  for (const msChunk of msChunks) {
    if (!idsToDelete.includes(msChunk.id)) {
      idsToDelete.push(msChunk.id);
    }
  }

  // Delete individual chunks
  if (idsToDelete.length > 0) {
    await supabase.from("document_chunks").delete().in("id", idsToDelete);
  }

  console.log(`Merged ${mergedCount} combined chunks, deleted ${idsToDelete.length} individual chunks`);
  return mergedCount;
}

// --- Main handler ---

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  let uploadIdForError: string | null = null;
  let supabaseForError: ReturnType<typeof createClient> | null = null;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    supabaseForError = supabase;

    const { upload_id, project_id, section_type, file_url, year } = await req.json();
    uploadIdForError = upload_id;

    if (!upload_id || !project_id || !section_type || !file_url) {
      throw new Error("upload_id, project_id, section_type, and file_url are required");
    }

    console.log(`Processing file for project ${project_id}, section: ${section_type}, year: ${year || 'N/A'}`);

    // Update status to processing
    await supabase.from("trainer_uploads").update({ processing_status: "processing" }).eq("id", upload_id);

    // Download the file
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("trainer-uploads")
      .download(file_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
    }
    const base64 = btoa(binary);
    const mimeType = fileData.type || "application/pdf";

    // Get project info
    const { data: project } = await supabase
      .from("trainer_projects")
      .select("product_id, subject, exam_board")
      .eq("id", project_id)
      .single();

    if (!project) throw new Error("Project not found");

    let productId = project.product_id;

    // Create or find draft product if needed
    if (!productId) {
      const slug = `${project.exam_board}-${project.subject}`.toLowerCase().replace(/\s+/g, '-');
      
      // First check if a product with this slug already exists
      const { data: existingProduct } = await supabase
        .from("products")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();

      if (existingProduct) {
        productId = existingProduct.id;
        console.log(`Found existing product ${productId} for slug ${slug}`);
      } else {
        const { data: newProduct, error: prodError } = await supabase
          .from("products")
          .insert({
            name: `${project.exam_board} ${project.subject}`,
            slug,
            subject: project.subject.toLowerCase(),
            exam_board: project.exam_board,
            monthly_price: 0,
            lifetime_price: 0,
            active: false,
          })
          .select("id")
          .single();

        if (prodError) throw new Error(`Failed to create draft product: ${prodError.message}`);
        productId = newProduct.id;
      }
      await supabase.from("trainer_projects").update({ product_id: productId }).eq("id", project_id);
    }

    // === PAST PAPER FLOW: classify → extract → validate → merge ===
    if (section_type === "past_paper") {
      // Use smarter model for past paper extraction
      const EXTRACTION_MODEL = "google/gemini-2.5-pro";

      // Step 1: Classify the document (stays on flash — simple task)
      console.log("Step 1: Classifying document...");
      let classification: { doc_type: string; paper_number: number };
      try {
        const classRaw = await callAI(lovableApiKey, buildClassificationPrompt(), base64, mimeType, 0.05, "google/gemini-2.5-flash");
        const parsed = parseJSONObject(classRaw);
        classification = {
          doc_type: String(parsed.doc_type).toLowerCase(),
          paper_number: Number(parsed.paper_number) || 1,
        };
        if (!["qp", "ms"].includes(classification.doc_type)) {
          throw new Error(`Invalid doc_type: ${classification.doc_type}`);
        }
      } catch (err) {
        console.error("Classification failed:", err);
        await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
        return new Response(JSON.stringify({ error: "Failed to classify document" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Classified as ${classification.doc_type} Paper ${classification.paper_number}`);

      // Update upload with classification
      await supabase.from("trainer_uploads").update({
        doc_type: classification.doc_type,
        paper_number: classification.paper_number,
      }).eq("id", upload_id);

      // Step 2: Extract content using the PRO model
      console.log(`Step 2: Extracting ${classification.doc_type} content with ${EXTRACTION_MODEL}...`);
      const extractionPrompt = classification.doc_type === "qp"
        ? buildQPExtractionPrompt(year || "unknown", project.subject || "unknown", project.exam_board || "unknown")
        : buildMSExtractionPrompt(year || "unknown", project.subject || "unknown", project.exam_board || "unknown");

      let chunks: Array<Record<string, unknown>>;
      let extractionAttempt = 0;
      const MAX_ATTEMPTS = 2;

      while (true) {
        extractionAttempt++;
        try {
          const extractRaw = await callAI(lovableApiKey, extractionPrompt, base64, mimeType, 0.1, EXTRACTION_MODEL);
          
          if (classification.doc_type === "qp") {
            // QP returns structured JSON object — flatten sections[].questions[] into a flat array
            try {
              const structured = parseJSONObject(extractRaw);
              const reportedCount = structured.question_count;
              const papers = (structured.papers as any[]) || [structured];
              const flatQuestions: Array<Record<string, unknown>> = [];
              for (const paper of papers) {
                const sections = paper.sections || [{ questions: paper.questions || [] }];
                for (const section of sections) {
                  const questions = section.questions || [];
                  for (const q of questions) {
                    flatQuestions.push({
                      question_number: q.number || q.question_number || "",
                      question_text: q.question || q.question_text || "",
                      total_marks: q.marks || q.total_marks || 0,
                      topic: q.topic || section.name || "",
                      extract: q.extract || null,
                      paper_code: paper.paper_code || "",
                      paper_name: paper.paper || "",
                    });
                  }
                }
              }

              // Log question count cross-check
              if (reportedCount) {
                console.log(`AI reported question_count: ${reportedCount}, actual extracted: ${flatQuestions.length}`);
                if (Math.abs(Number(reportedCount) - flatQuestions.length) > 2) {
                  console.warn(`Question count mismatch! Reported ${reportedCount} vs extracted ${flatQuestions.length}`);
                }
              }

              chunks = flatQuestions;
            } catch {
              // Fallback: try parsing as flat array
              chunks = parseJSONArray(extractRaw);
            }
          } else {
            // MS extraction — parse new format
            try {
              const structured = parseJSONObject(extractRaw);
              const marks = (structured.marks as any[]) || [];
              chunks = marks.map((m: any) => ({
                question_number: m.question_number || "",
                mark_scheme: m.mark_scheme || "",
                total_marks: m.total_marks || 0,
                topic: m.topic || "",
              }));
              const reportedCount = structured.question_count;
              if (reportedCount) {
                console.log(`MS AI reported question_count: ${reportedCount}, actual extracted: ${chunks.length}`);
              }
            } catch {
              chunks = parseJSONArray(extractRaw);
            }
          }

          // Step 2b: Validate extraction
          const validation = validateExtraction(chunks, classification.doc_type);
          console.log(`Validation: ${validation.valid ? "PASSED" : "ISSUES FOUND"} — ${validation.questionCount} questions, ${validation.issues.length} issues`);

          if (!validation.valid) {
            for (const issue of validation.issues) {
              console.warn(`Validation issue: ${issue}`);
            }
          }

          // If validation found issues and this is the first attempt, retry once
          if (!validation.valid && extractionAttempt < MAX_ATTEMPTS && validation.questionCount > 0) {
            console.log(`Retrying extraction (attempt ${extractionAttempt + 1}) due to validation issues...`);
            continue; // retry the while loop
          }

          break; // extraction succeeded (or second attempt done)
        } catch (err) {
          console.error(`Extraction failed (attempt ${extractionAttempt}):`, err);
          if (String(err).includes("AI_ERROR:429")) {
            await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
            return new Response(JSON.stringify({ error: "Rate limited. Please try again in a minute." }), {
              status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          if (extractionAttempt >= MAX_ATTEMPTS) {
            await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
            return new Response(JSON.stringify({ error: "Failed to extract content" }), {
              status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          // Try again
          continue;
        }
      }

      // Step 3: Insert individual chunks with upload_id in metadata
      let chunksCreated = 0;
      for (const chunk of chunks) {
        const qNum = chunk.question_number || "";
        const extractInfo = chunk.extract ? `\nContext: ${chunk.extract}` : "";
        const content = classification.doc_type === "qp"
          ? `Question ${qNum}: ${chunk.question_text || ""}${extractInfo}`
          : `Mark Scheme Q${qNum}: ${chunk.mark_scheme || ""}`;

        const embedding = await generateEmbedding(lovableApiKey, content);

        const metadata: Record<string, unknown> = {
          content_type: `past_paper_${classification.doc_type}`,
          upload_id,
          question_number: String(qNum),
          topic: chunk.topic || "",
          total_marks: chunk.total_marks,
          year: year || "unknown",
          paper_number: classification.paper_number,
        };

        if (classification.doc_type === "ms") {
          metadata.mark_scheme_text = chunk.mark_scheme || "";
        }

        const { error: insertErr } = await supabase.from("document_chunks").insert({
          product_id: productId,
          content,
          embedding,
          metadata,
        });

        if (!insertErr) chunksCreated++;
        else console.error("Chunk insert error:", insertErr);
      }

      // Update upload status
      await supabase.from("trainer_uploads").update({
        processing_status: "done",
        chunks_created: chunksCreated,
      }).eq("id", upload_id);

      // Step 4: Attempt auto-merge
      console.log("Step 4: Checking for merge counterpart...");
      let mergedCount = 0;
      try {
        mergedCount = await attemptMerge(
          supabase, lovableApiKey, project_id, year || "",
          classification.paper_number, classification.doc_type,
          upload_id, productId,
        );
      } catch (mergeErr) {
        console.error("Merge attempt failed (non-fatal):", mergeErr);
      }

      console.log(`Done: ${chunksCreated} chunks created, ${mergedCount} merged`);
      return new Response(JSON.stringify({
        success: true,
        chunks_created: chunksCreated,
        merged_count: mergedCount,
        doc_type: classification.doc_type,
        paper_number: classification.paper_number,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // === SPECIFICATION / GENERIC FLOW (unchanged) ===
    const extractionPrompt = section_type === "specification"
      ? buildSpecificationPrompt()
      : buildGenericPrompt(section_type);

    let rawContent: string;
    try {
      rawContent = await callAI(lovableApiKey, extractionPrompt, base64, mimeType);
    } catch (err) {
      console.error("AI call failed:", err);
      if (String(err).includes("AI_ERROR:429")) {
        await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw err;
    }

    let chunks: Array<Record<string, unknown>>;
    try {
      chunks = parseJSONArray(rawContent);
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Failed to parse extracted content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let chunksCreated = 0;
    for (const chunk of chunks) {
      const content = section_type === "specification"
        ? `[${chunk.topic}${chunk.subtopic ? ` > ${chunk.subtopic}` : ''}] ${chunk.content}`
        : chunk.content as string;

      const embedding = await generateEmbedding(lovableApiKey, content);

      const metadata: Record<string, unknown> = {
        content_type: chunk.content_type || section_type,
        topic: chunk.topic || "",
        upload_id,
      };
      if (year) metadata.year = year;

      const { error: insertErr } = await supabase.from("document_chunks").insert({
        product_id: productId,
        content,
        embedding,
        metadata,
      });

      if (!insertErr) chunksCreated++;
      else console.error("Chunk insert error:", insertErr);
    }

    await supabase.from("trainer_uploads").update({
      processing_status: "done",
      chunks_created: chunksCreated,
    }).eq("id", upload_id);

    console.log(`Successfully processed ${chunksCreated} chunks for upload ${upload_id}`);
    return new Response(JSON.stringify({ success: true, chunks_created: chunksCreated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Process training file error:", error);

    if (supabaseForError && uploadIdForError) {
      try {
        await supabaseForError
          .from("trainer_uploads")
          .update({ processing_status: "error" })
          .eq("id", uploadIdForError);
      } catch (statusErr) {
        console.error("Failed to mark upload as error:", statusErr);
      }
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
