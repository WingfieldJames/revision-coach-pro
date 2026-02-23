import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
    await supabase
      .from("trainer_uploads")
      .update({ processing_status: "processing" })
      .eq("id", upload_id);

    // Download the file from storage
    // file_url is the storage path like "project_id/filename.pdf"
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("trainer-uploads")
      .download(file_url);

    if (downloadError || !fileData) {
      throw new Error(`Failed to download file: ${downloadError?.message}`);
    }

    // Convert file to base64 for Gemini vision
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = fileData.type || "application/pdf";

    // Build the extraction prompt based on section type
    let extractionPrompt = "";
    
    if (section_type === "specification") {
      extractionPrompt = `You are a document extraction expert. Extract ALL specification points, topics, and sub-topics from this document.

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
    } else if (section_type.startsWith("paper_")) {
      extractionPrompt = `You are an exam paper extraction expert. Extract each question with its sub-parts and the corresponding mark scheme answers from this combined question paper + mark scheme document.

Output as a JSON array of objects, one per question:
[
  {
    "question_number": "1",
    "question_text": "Full question text including all sub-parts (a), (b), (c) etc.",
    "mark_scheme": "Full mark scheme for this question including M1, A1, B1 codes and acceptable answers",
    "total_marks": 6,
    "topic": "Topic this question covers",
    "content_type": "${section_type}",
    "year": "${year || 'unknown'}"
  }
]

Be thorough - capture every question and its complete mark scheme. Preserve mark allocation codes (M1, A1, B1 etc).`;
    } else {
      extractionPrompt = `Extract all relevant content from this document and structure it as a JSON array of chunks:
[
  {
    "content": "The extracted content",
    "topic": "Topic or section name",
    "content_type": "${section_type}"
  }
]`;
    }

    // Call Gemini via Lovable AI gateway with the file
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              { type: "text", text: extractionPrompt },
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
            ],
          },
        ],
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      
      if (aiResponse.status === 429) {
        await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a minute." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      throw new Error(`AI processing failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const rawContent = aiData.choices?.[0]?.message?.content || "";

    // Parse the JSON from AI response (it may be wrapped in markdown code blocks)
    let chunks: Array<Record<string, unknown>> = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        chunks = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON array found in AI response");
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
      console.error("Raw content:", rawContent.substring(0, 500));
      await supabase.from("trainer_uploads").update({ processing_status: "error" }).eq("id", upload_id);
      return new Response(JSON.stringify({ error: "Failed to parse extracted content" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the project to find/create the product_id
    const { data: project } = await supabase
      .from("trainer_projects")
      .select("product_id, subject, exam_board")
      .eq("id", project_id)
      .single();

    if (!project) {
      throw new Error("Project not found");
    }

    let productId = project.product_id;

    // If no product_id yet, create a draft product
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

      // Link product to project
      await supabase.from("trainer_projects").update({ product_id: productId }).eq("id", project_id);
    }

    // Generate embeddings and insert chunks
    let chunksCreated = 0;
    for (const chunk of chunks) {
      const content = section_type === "specification"
        ? `[${chunk.topic}${chunk.subtopic ? ` > ${chunk.subtopic}` : ''}] ${chunk.content}`
        : section_type.startsWith("paper_")
        ? `Question ${chunk.question_number}: ${chunk.question_text}\n\nMark Scheme: ${chunk.mark_scheme}\n\nTotal Marks: ${chunk.total_marks}`
        : chunk.content as string;

      // Generate embedding
      const embResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ model: "text-embedding-3-small", input: content }),
      });

      let embedding = null;
      if (embResponse.ok) {
        const embData = await embResponse.json();
        embedding = embData.data?.[0]?.embedding;
      }

      const metadata: Record<string, unknown> = {
        content_type: chunk.content_type || section_type,
        topic: chunk.topic || "",
      };
      if (year) metadata.year = year;
      if (chunk.question_number) metadata.question_number = chunk.question_number;
      if (chunk.total_marks) metadata.total_marks = chunk.total_marks;

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
