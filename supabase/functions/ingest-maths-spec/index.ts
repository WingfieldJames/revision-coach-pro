import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const EDEXCEL_MATHS_PRODUCT_ID = "f47ac10b-58cc-4372-a567-0e02b2c3d479";

interface Subtopic {
  code: string;
  learning: string;
  [key: string]: unknown;
}

interface Topic {
  topic_number: number;
  topic_name: string;
  subtopics?: Subtopic[];
  note?: string;
}

function extractPureChunks(topics: Topic[]): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const topic of topics) {
    if (!topic.subtopics || topic.subtopics.length === 0) continue;

    for (const sub of topic.subtopics) {
      let content = `[Edexcel A-Level Mathematics Specification 9MA0 - ${sub.code}: ${topic.topic_name}]\n\n`;
      content += `Paper: Paper 1 and Paper 2 (Pure Mathematics)\n`;
      content += `Topic ${topic.topic_number}: ${topic.topic_name}\n`;
      content += `Section: ${sub.code}\n\n`;
      content += `LEARNING OBJECTIVE:\n${sub.learning}\n`;

      // Add any extra structured data
      for (const [key, value] of Object.entries(sub)) {
        if (key === "code" || key === "learning") continue;
        if (Array.isArray(value)) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n`;
          for (const item of value) {
            if (typeof item === "string") {
              content += `- ${item}\n`;
            } else if (typeof item === "object" && item !== null) {
              content += `- ${JSON.stringify(item)}\n`;
            }
          }
        } else if (typeof value === "string") {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}: ${value}\n`;
        } else if (typeof value === "object" && value !== null) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n${JSON.stringify(value, null, 2)}\n`;
        }
      }

      chunks.push({
        content: content.trim(),
        metadata: {
          content_type: "specification",
          topic: `${sub.code} ${topic.topic_name}`,
          section: "Pure Mathematics",
          spec_id: sub.code,
          paper: "Paper 1 and Paper 2",
          source: "Edexcel A-Level Mathematics 9MA0 Specification",
        },
      });
    }
  }

  return chunks;
}

function extractStatsChunks(topics: Topic[]): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const topic of topics) {
    if (!topic.subtopics || topic.subtopics.length === 0) {
      // Some mechanics topics have only a note
      if (topic.note) {
        chunks.push({
          content: `[Edexcel A-Level Mathematics Specification 9MA0 - Topic ${topic.topic_number}: ${topic.topic_name}]\n\nPaper: Paper 3 (Statistics and Mechanics)\nSection: Statistics\n\n${topic.note}`,
          metadata: {
            content_type: "specification",
            topic: `${topic.topic_number} ${topic.topic_name}`,
            section: "Statistics",
            paper: "Paper 3",
            source: "Edexcel A-Level Mathematics 9MA0 Specification",
          },
        });
      }
      continue;
    }

    for (const sub of topic.subtopics) {
      let content = `[Edexcel A-Level Mathematics Specification 9MA0 - ${sub.code}: ${topic.topic_name}]\n\n`;
      content += `Paper: Paper 3 (Statistics and Mechanics)\n`;
      content += `Section: Statistics\n`;
      content += `Topic ${topic.topic_number}: ${topic.topic_name}\n`;
      content += `Section: ${sub.code}\n\n`;
      content += `LEARNING OBJECTIVE:\n${sub.learning}\n`;

      for (const [key, value] of Object.entries(sub)) {
        if (key === "code" || key === "learning") continue;
        if (Array.isArray(value)) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n`;
          for (const item of value) {
            if (typeof item === "string") {
              content += `- ${item}\n`;
            } else if (typeof item === "object" && item !== null) {
              content += `- ${JSON.stringify(item)}\n`;
            }
          }
        } else if (typeof value === "string") {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}: ${value}\n`;
        } else if (typeof value === "object" && value !== null) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n${JSON.stringify(value, null, 2)}\n`;
        }
      }

      chunks.push({
        content: content.trim(),
        metadata: {
          content_type: "specification",
          topic: `${sub.code} ${topic.topic_name}`,
          section: "Statistics",
          paper: "Paper 3",
          source: "Edexcel A-Level Mathematics 9MA0 Specification",
        },
      });
    }
  }

  return chunks;
}

function extractMechanicsChunks(topics: Topic[]): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const topic of topics) {
    if (topic.note) {
      chunks.push({
        content: `[Edexcel A-Level Mathematics Specification 9MA0 - Topic ${topic.topic_number}: ${topic.topic_name}]\n\nPaper: Paper 3 (Statistics and Mechanics)\nSection: Mechanics\n\n${topic.note}`,
        metadata: {
          content_type: "specification",
          topic: `${topic.topic_number} ${topic.topic_name}`,
          section: "Mechanics",
          paper: "Paper 3",
          source: "Edexcel A-Level Mathematics 9MA0 Specification",
        },
      });
    }

    if (!topic.subtopics || topic.subtopics.length === 0) continue;

    for (const sub of topic.subtopics) {
      let content = `[Edexcel A-Level Mathematics Specification 9MA0 - ${sub.code}: ${topic.topic_name}]\n\n`;
      content += `Paper: Paper 3 (Statistics and Mechanics)\n`;
      content += `Section: Mechanics\n`;
      content += `Topic ${topic.topic_number}: ${topic.topic_name}\n`;
      content += `Section: ${sub.code}\n\n`;
      content += `LEARNING OBJECTIVE:\n${sub.learning}\n`;

      for (const [key, value] of Object.entries(sub)) {
        if (key === "code" || key === "learning") continue;
        if (Array.isArray(value)) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n`;
          for (const item of value) {
            if (typeof item === "string") {
              content += `- ${item}\n`;
            } else if (typeof item === "object" && item !== null) {
              content += `- ${JSON.stringify(item)}\n`;
            }
          }
        } else if (typeof value === "string") {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}: ${value}\n`;
        } else if (typeof value === "object" && value !== null) {
          content += `\n${key.toUpperCase().replace(/_/g, " ")}:\n${JSON.stringify(value, null, 2)}\n`;
        }
      }

      chunks.push({
        content: content.trim(),
        metadata: {
          content_type: "specification",
          topic: `${sub.code} ${topic.topic_name}`,
          section: "Mechanics",
          paper: "Paper 3",
          source: "Edexcel A-Level Mathematics 9MA0 Specification",
        },
      });
    }
  }

  return chunks;
}

function extractOverarchingThemes(themes: Record<string, unknown>): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  for (const [key, value] of Object.entries(themes)) {
    if (key === "note") continue;
    if (typeof value !== "object" || value === null) continue;

    const theme = value as Record<string, unknown>;
    let content = `[Edexcel A-Level Mathematics Specification 9MA0 - Overarching Theme: ${key.replace(/_/g, " ")}]\n\n`;
    content += `Code: ${theme.code || ""}\n`;

    if (theme.general_requirement) {
      content += `\nGENERAL REQUIREMENT:\n${theme.general_requirement}\n`;
    }

    if (theme.skills && Array.isArray(theme.skills)) {
      content += `\nSKILLS:\n`;
      for (const skill of theme.skills as Array<Record<string, unknown>>) {
        content += `\n${skill.code}: ${skill.skill}\n`;
        if (skill.key_vocabulary && Array.isArray(skill.key_vocabulary)) {
          content += `Key vocabulary: ${(skill.key_vocabulary as string[]).join(", ")}\n`;
        }
      }
    }

    chunks.push({
      content: content.trim(),
      metadata: {
        content_type: "specification",
        topic: `Overarching Theme - ${key.replace(/_/g, " ")}`,
        section: "Overarching Themes",
        source: "Edexcel A-Level Mathematics 9MA0 Specification",
      },
    });
  }

  return chunks;
}

function extractQualificationOverview(specData: Record<string, unknown>): Array<{ content: string; metadata: Record<string, unknown> }> {
  const chunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

  // Qualification at a glance
  if (specData.qualification_at_a_glance) {
    const qag = specData.qualification_at_a_glance as Record<string, unknown>;
    let content = `[Edexcel A-Level Mathematics Specification 9MA0 - Qualification Overview]\n\n`;
    content += JSON.stringify(qag, null, 2);

    chunks.push({
      content: content.trim(),
      metadata: {
        content_type: "specification",
        topic: "Qualification Overview",
        section: "General",
        source: "Edexcel A-Level Mathematics 9MA0 Specification",
      },
    });
  }

  // Aims and objectives
  if (specData.qualification_aims_and_objectives && Array.isArray(specData.qualification_aims_and_objectives)) {
    let content = `[Edexcel A-Level Mathematics Specification 9MA0 - Aims and Objectives]\n\n`;
    content += "QUALIFICATION AIMS AND OBJECTIVES:\n";
    for (const aim of specData.qualification_aims_and_objectives as string[]) {
      content += `- ${aim}\n`;
    }

    chunks.push({
      content: content.trim(),
      metadata: {
        content_type: "specification",
        topic: "Aims and Objectives",
        section: "General",
        source: "Edexcel A-Level Mathematics 9MA0 Specification",
      },
    });
  }

  // Large data set info
  if (specData.statistics_large_data_set) {
    const lds = specData.statistics_large_data_set as Record<string, unknown>;
    let content = `[Edexcel A-Level Mathematics Specification 9MA0 - Statistics Large Data Set]\n\n`;
    content += JSON.stringify(lds, null, 2);

    chunks.push({
      content: content.trim(),
      metadata: {
        content_type: "specification",
        topic: "Statistics Large Data Set",
        section: "Statistics",
        paper: "Paper 3",
        source: "Edexcel A-Level Mathematics 9MA0 Specification",
      },
    });
  }

  // Assessment info
  if (specData.subject_content) {
    const sc = specData.subject_content as Record<string, unknown>;
    if (sc.assessment_information_and_synopticity) {
      let content = `[Edexcel A-Level Mathematics Specification 9MA0 - Assessment Information]\n\n`;
      content += JSON.stringify(sc.assessment_information_and_synopticity, null, 2);

      chunks.push({
        content: content.trim(),
        metadata: {
          content_type: "specification",
          topic: "Assessment Information",
          section: "General",
          source: "Edexcel A-Level Mathematics 9MA0 Specification",
        },
      });
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

    const specData = await req.json();

    if (!specData || !specData.subject_content) {
      throw new Error("spec data with subject_content is required");
    }

    console.log(`Processing Edexcel Maths specification`);

    const allChunks: Array<{ content: string; metadata: Record<string, unknown> }> = [];

    // Extract qualification overview chunks
    allChunks.push(...extractQualificationOverview(specData));

    // Extract overarching themes
    if (specData.overarching_themes) {
      allChunks.push(...extractOverarchingThemes(specData.overarching_themes));
    }

    // Extract pure mathematics topics
    const sc = specData.subject_content;
    if (sc.pure_mathematics_topics_for_papers_1_and_2) {
      allChunks.push(...extractPureChunks(sc.pure_mathematics_topics_for_papers_1_and_2));
    }

    // Extract statistics topics
    if (sc.paper_3_statistics_and_mechanics_topics) {
      const p3 = sc.paper_3_statistics_and_mechanics_topics;
      if (p3.section_a_statistics) {
        allChunks.push(...extractStatsChunks(p3.section_a_statistics));
      }
      if (p3.section_b_mechanics) {
        allChunks.push(...extractMechanicsChunks(p3.section_b_mechanics));
      }
    }

    console.log(`Generated ${allChunks.length} specification chunks`);

    // Prepare rows
    const rows = allChunks.map(chunk => ({
      product_id: EDEXCEL_MATHS_PRODUCT_ID,
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
        total: allChunks.length,
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
