import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Prompt builders ---

function buildClassificationPrompt(): string {
  return `You are a document classification expert. Analyze this document and determine:
1. Is it a Question Paper (QP) or a Mark Scheme (MS)?
2. What paper number is it? (e.g. Paper 1, Paper 2, Paper 3)

Look at the title page, headers, and content to determine this.

Return ONLY a JSON object (no markdown):
{
  "doc_type": "qp" or "ms",
  "paper_number": 1 or 2 or 3 etc,
  "confidence": "high" or "medium" or "low"
}`;
}

function buildQPExtractionPrompt(year: string): string {
  return `You are an exam paper extraction expert. Extract each question with its sub-parts from this Question Paper.

Output as a JSON array of objects, one per question:
[
  {
    "question_number": "1",
    "question_text": "Full question text including all sub-parts (a), (b), (c) etc.",
    "total_marks": 6,
    "topic": "Topic this question covers"
  }
]

Year: ${year}
Be thorough - capture every question. Preserve sub-part labels and mark allocations.`;
}

function buildMSExtractionPrompt(year: string): string {
  return `You are a mark scheme extraction expert. Extract the mark scheme answers for each question from this document.

Output as a JSON array of objects, one per question:
[
  {
    "question_number": "1",
    "mark_scheme": "Full mark scheme for this question including M1, A1, B1 codes and acceptable answers for all sub-parts",
    "total_marks": 6,
    "topic": "Topic this question covers"
  }
]

Year: ${year}
Be thorough - capture every question's marking points. Preserve mark allocation codes (M1, A1, B1 etc).`;
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
): Promise<string> {
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
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

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { upload_id, project_id, section_type, file_url, year } = await req.json();

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
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || "application/pdf";

    // Get project info
    const { data: project } = await supabase
      .from("trainer_projects")
      .select("product_id, subject, exam_board")
      .eq("id", project_id)
      .single();

    if (!project) throw new Error("Project not found");

    let productId = project.product_id;

    // Create draft product if needed
    if (!productId) {
      const slug = `${project.exam_board}-${project.subject}`.toLowerCase().replace(/\s+/g, '-');
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
      await supabase.from("trainer_projects").update({ product_id: productId }).eq("id", project_id);
    }

    // === PAST PAPER FLOW: classify → extract → merge ===
    if (section_type === "past_paper") {
      // Step 1: Classify the document
      console.log("Step 1: Classifying document...");
      let classification: { doc_type: string; paper_number: number };
      try {
        const classRaw = await callAI(lovableApiKey, buildClassificationPrompt(), base64, mimeType, 0.05);
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

      // Step 2: Extract content based on doc_type
      console.log(`Step 2: Extracting ${classification.doc_type} content...`);
      const extractionPrompt = classification.doc_type === "qp"
        ? buildQPExtractionPrompt(year || "unknown")
        : buildMSExtractionPrompt(year || "unknown");

      let chunks: Array<Record<string, unknown>>;
      try {
        const extractRaw = await callAI(lovableApiKey, extractionPrompt, base64, mimeType);
        chunks = parseJSONArray(extractRaw);
      } catch (err) {
        console.error("Extraction failed:", err);
        if (String(err).includes("AI_ERROR:429")) {
          await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
          return new Response(JSON.stringify({ error: "Rate limited. Please try again in a minute." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
        return new Response(JSON.stringify({ error: "Failed to extract content" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Step 3: Insert individual chunks with upload_id in metadata
      let chunksCreated = 0;
      for (const chunk of chunks) {
        const qNum = chunk.question_number || "";
        const content = classification.doc_type === "qp"
          ? `Question ${qNum}: ${chunk.question_text || ""}`
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
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
