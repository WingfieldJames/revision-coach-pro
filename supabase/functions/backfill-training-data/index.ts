import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

      // 1. Backfill system_prompt from products.system_prompt_deluxe
      if (!project.system_prompt || project.system_prompt.trim().length === 0) {
        // First try document_chunks
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
          // Fallback to products table
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

      // 2. Backfill exam_technique from document_chunks
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

      // 3. Backfill staged_specifications from document_chunks
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

      // 4. Backfill custom_sections from document_chunks
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
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
