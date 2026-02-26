import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Canonical live feature configs for legacy subjects (matches Header props)
const LEGACY_CONFIGS: Record<string, {
  selectedFeatures: string[];
  examDates: Array<{ name: string; date: string }>;
  essayMarkerMarks: number[];
  trainerDescription?: string;
}> = {
  "aqa::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1", date: "2026-05-11" },
      { name: "Paper 2", date: "2026-05-18" },
      { name: "Paper 3", date: "2026-06-04" },
    ],
    essayMarkerMarks: [9, 10, 15, 25],
    trainerDescription: "Hi, I'm Etienne — founder of EasyNomics, UKMT Gold Award winner, and John Locke Economics shortlisted. I trained A* AI on AQA Economics to help you achieve the top grades.",
  },
  "edexcel::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Markets and Business Behaviour)", date: "2026-05-11" },
      { name: "Paper 2 (The National and Global Economy)", date: "2026-05-18" },
      { name: "Paper 3 (Microeconomics and Macroeconomics)", date: "2026-06-04" },
    ],
    essayMarkerMarks: [],
    trainerDescription: "Hi, I'm James — I got A* in Economics with 90% across all papers, A*A*A at A-Level, and straight 9s at GCSE. I'm studying at LSE and built A* AI to help you achieve the same results.",
  },
  "cie::economics": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Multiple Choice)", date: "2026-05-12" },
      { name: "Paper 2 (Data Response & Essays)", date: "2026-05-22" },
      { name: "Paper 3 (Multiple Choice)", date: "2026-06-10" },
      { name: "Paper 4 (Data Response & Essays)", date: "2026-05-20" },
    ],
    essayMarkerMarks: [],
    trainerDescription: "Hi, I'm Carl — I got A*A*A* at A-Level as an international student and achieved 5A*s in IGCSE in one year. I'm studying at LSE and trained A* AI on CIE Economics.",
  },
  "ocr::physics": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Modelling Physics)", date: "2026-05-20" },
      { name: "Paper 2 (Exploring Physics)", date: "2026-06-01" },
      { name: "Paper 3 (Unified Physics)", date: "2026-06-08" },
    ],
    essayMarkerMarks: [6],
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 200/200 in Physics and straight 9s at GCSE. I trained A* AI on OCR Physics past papers and mark schemes to help you ace your exams.",
  },
  "ocr::computer science": {
    selectedFeatures: ["my_ai", "diagram_generator", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Computer Systems)", date: "2026-06-10" },
      { name: "Paper 2 (Algorithms & Programming)", date: "2026-06-17" },
    ],
    essayMarkerMarks: [9, 12],
    trainerDescription: "Hi, I'm Naman — I got A*A*A*A* at A-Level with straight 9s at GCSE and an 8.9 TMUA score. I trained A* AI on OCR Computer Science to help you master algorithms, data structures, and exam technique.",
  },
  "aqa::chemistry": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Inorganic & Physical)", date: "2026-05-13" },
      { name: "Paper 2 (Organic & Physical)", date: "2026-05-20" },
      { name: "Paper 3 (All topics)", date: "2026-06-10" },
    ],
    essayMarkerMarks: [6],
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 197/200 in Chemistry and straight 9s at GCSE. I trained A* AI on AQA Chemistry to help you master every topic and ace your exams.",
  },
  "aqa::psychology": {
    selectedFeatures: ["my_ai", "essay_marker", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Introductory Topics)", date: "2026-05-14" },
      { name: "Paper 2 (Psychology in Context)", date: "2026-05-27" },
      { name: "Paper 3 (Issues and Options)", date: "2026-06-08" },
    ],
    essayMarkerMarks: [16],
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level and straight 9s at GCSE. I trained A* AI on AQA Psychology past papers, mark schemes and specification to help you achieve top grades.",
  },
  "edexcel::mathematics": {
    selectedFeatures: ["my_ai", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Pure Mathematics 1)", date: "2026-06-02" },
      { name: "Paper 2 (Pure Mathematics 2)", date: "2026-06-09" },
      { name: "Paper 3 (Stats & Mechanics)", date: "2026-06-15" },
    ],
    essayMarkerMarks: [],
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 236/240 in Mathematics and straight 9s at GCSE. I trained A* AI on Edexcel Maths past papers and specifications.",
  },
  "edexcel::mathematics applied": {
    selectedFeatures: ["my_ai", "past_papers", "revision_guide", "exam_countdown"],
    examDates: [
      { name: "Paper 1 (Pure Mathematics 1)", date: "2026-06-02" },
      { name: "Paper 2 (Pure Mathematics 2)", date: "2026-06-09" },
      { name: "Paper 3 (Stats & Mechanics)", date: "2026-06-15" },
    ],
    essayMarkerMarks: [],
    trainerDescription: "Hi, I'm Tudor — I got A*A*A*A* at A-Level with 236/240 in Mathematics and straight 9s at GCSE. I trained A* AI on Edexcel Maths Applied (Stats & Mechanics) content.",
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get all trainer_projects with a product_id (deployed subjects)
    const { data: projects, error: projErr } = await supabase
      .from("trainer_projects")
      .select("*")
      .not("product_id", "is", null);

    if (projErr) throw projErr;
    if (!projects || projects.length === 0) {
      return new Response(JSON.stringify({ message: "No deployed projects to backfill" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: Array<{ project_id: string; subject: string; updates: string[] }> = [];

    for (const project of projects) {
      const updates: string[] = [];
      const updatePayload: Record<string, unknown> = {};
      const productId = project.product_id;
      const legacyKey = `${(project.exam_board || "").toLowerCase()}::${(project.subject || "").toLowerCase()}`;
      const legacyConfig = LEGACY_CONFIGS[legacyKey];

      // 1. Backfill system_prompt
      if (!project.system_prompt || project.system_prompt.trim().length === 0) {
        const { data: spChunks } = await supabase
          .from("document_chunks")
          .select("content")
          .eq("product_id", productId)
          .contains("metadata", { content_type: "system_prompt" })
          .order("created_at", { ascending: true });

        if (spChunks && spChunks.length > 0) {
          updatePayload.system_prompt = spChunks.map((c: any) => c.content).join("\n\n");
          updatePayload.system_prompt_submitted = true;
          updates.push("system_prompt (from chunks)");
        } else {
          const { data: product } = await supabase
            .from("products")
            .select("system_prompt_deluxe")
            .eq("id", productId)
            .single();
          if (product?.system_prompt_deluxe) {
            updatePayload.system_prompt = product.system_prompt_deluxe;
            updatePayload.system_prompt_submitted = true;
            updates.push("system_prompt (from products)");
          }
        }
      }

      // 2. Backfill exam_technique
      if (!project.exam_technique || project.exam_technique.trim().length === 0) {
        const { data: etChunks } = await supabase
          .from("document_chunks")
          .select("content")
          .eq("product_id", productId)
          .contains("metadata", { content_type: "exam_technique" })
          .order("created_at", { ascending: true });

        if (etChunks && etChunks.length > 0) {
          updatePayload.exam_technique = etChunks.map((c: any) => c.content).join("\n\n");
          updatePayload.exam_technique_submitted = true;
          updates.push("exam_technique");
        }
      }

      // 3. Backfill staged_specifications
      if (!project.staged_specifications ||
          !Array.isArray(project.staged_specifications) ||
          project.staged_specifications.length === 0) {
        const { data: specChunks } = await supabase
          .from("document_chunks")
          .select("content")
          .eq("product_id", productId)
          .contains("metadata", { content_type: "specification" })
          .order("created_at", { ascending: true })
          .limit(2000);

        if (specChunks && specChunks.length > 0) {
          updatePayload.staged_specifications = specChunks.map((c: any) => c.content);
          updates.push(`staged_specifications (${specChunks.length} points)`);
        }
      }

      // 4. Backfill custom_sections
      if (!project.custom_sections ||
          !Array.isArray(project.custom_sections) ||
          project.custom_sections.length === 0) {
        const { data: csChunks } = await supabase
          .from("document_chunks")
          .select("content")
          .eq("product_id", productId)
          .contains("metadata", { content_type: "custom_section" })
          .order("created_at", { ascending: true });

        if (csChunks && csChunks.length > 0) {
          const sections = csChunks.map((chunk: any) => {
            const match = chunk.content.match(/^\[([^\]]+)\]\n([\s\S]*)$/);
            if (match) return { name: match[1], content: match[2] };
            return { name: "Imported Section", content: chunk.content };
          });
          updatePayload.custom_sections = sections;
          updates.push(`custom_sections (${sections.length})`);
        }
      }

      // 5. Backfill selected_features from legacy config
      if (legacyConfig) {
        const currentFeatures = project.selected_features;
        if (!currentFeatures || !Array.isArray(currentFeatures) || currentFeatures.length === 0) {
          updatePayload.selected_features = legacyConfig.selectedFeatures;
          updates.push(`selected_features (${legacyConfig.selectedFeatures.join(", ")})`);
        }

        // 6. Backfill exam_dates
        const currentDates = project.exam_dates;
        if (!currentDates || !Array.isArray(currentDates) || currentDates.length === 0) {
          updatePayload.exam_dates = legacyConfig.examDates;
          updates.push(`exam_dates (${legacyConfig.examDates.length} papers)`);
        }

        // 7. Backfill essay_marker_marks
        const currentMarks = project.essay_marker_marks;
        if ((!currentMarks || !Array.isArray(currentMarks) || currentMarks.length === 0) &&
            legacyConfig.essayMarkerMarks.length > 0) {
          updatePayload.essay_marker_marks = legacyConfig.essayMarkerMarks;
          updates.push(`essay_marker_marks (${legacyConfig.essayMarkerMarks.join(", ")})`);
        }

        // 7b. Backfill trainer_description
        if ((!project.trainer_description || !project.trainer_description.trim()) && legacyConfig.trainerDescription) {
          updatePayload.trainer_description = legacyConfig.trainerDescription;
          updatePayload.trainer_bio_submitted = true;
          updates.push("trainer_description (from legacy)");
        }
      }

      // 8. Backfill synthetic trainer_uploads for past papers from document_chunks
      const { data: existingUploads } = await supabase
        .from("trainer_uploads")
        .select("id")
        .eq("project_id", project.id)
        .eq("section_type", "past_paper")
        .limit(1);

      if (!existingUploads || existingUploads.length === 0) {
        // Find all past-paper-like chunks for this product
        const { data: ppChunks } = await supabase
          .from("document_chunks")
          .select("metadata")
          .eq("product_id", productId)
          .limit(5000);

        if (ppChunks && ppChunks.length > 0) {
          // Group by year + paper_number + doc_type from metadata
          const groups = new Map<string, { year: string; paperNumber: number | null; docType: string | null; count: number }>();

          for (const chunk of ppChunks) {
            const meta = chunk.metadata as any;
            if (!meta) continue;

            const contentType = meta.content_type || "";
            // Skip non-paper content types
            if (["system_prompt", "exam_technique", "specification", "custom_section"].includes(contentType)) continue;

            const year = meta.year || meta.exam_year || null;
            const paperNumber = meta.paper_number || meta.paper || null;
            const docType = meta.doc_type || (contentType.includes("mark_scheme") ? "MS" : contentType.includes("paper") ? "QP" : null);

            if (!year) continue;

            const key = `${year}::${paperNumber || "null"}::${docType || "combined"}`;
            const existing = groups.get(key);
            if (existing) {
              existing.count++;
            } else {
              groups.set(key, { year: String(year), paperNumber: paperNumber ? Number(paperNumber) : null, docType, count: 1 });
            }
          }

          // Create synthetic trainer_uploads for each group
          const insertsArray: any[] = [];
          for (const [, group] of groups) {
            insertsArray.push({
              project_id: project.id,
              section_type: "past_paper",
              year: group.year,
              paper_number: group.paperNumber,
              doc_type: group.docType,
              file_name: `Legacy import — ${group.year}${group.paperNumber ? ` P${group.paperNumber}` : ""}${group.docType ? ` ${group.docType}` : ""}`,
              file_url: `legacy-import/${project.id}/${group.year}_${group.paperNumber || "all"}_${group.docType || "combined"}`,
              processing_status: "done",
              chunks_created: group.count,
            });
          }

          if (insertsArray.length > 0) {
            const { error: insertErr } = await supabase
              .from("trainer_uploads")
              .insert(insertsArray);
            if (insertErr) {
              updates.push(`ERROR inserting uploads: ${insertErr.message}`);
            } else {
              updates.push(`synthetic trainer_uploads (${insertsArray.length} records)`);
            }
          }
        }
      }

      // Apply updates if any
      if (Object.keys(updatePayload).length > 0) {
        const { error: updateErr } = await supabase
          .from("trainer_projects")
          .update(updatePayload)
          .eq("id", project.id);

        if (updateErr) {
          updates.push(`ERROR: ${updateErr.message}`);
        }
      }

      results.push({
        project_id: project.id,
        subject: `${project.exam_board} ${project.subject}`,
        updates: updates.length > 0 ? updates : ["no changes needed"],
      });
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
