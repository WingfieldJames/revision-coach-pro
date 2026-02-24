import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { project_id, staged_specifications, staged_system_prompt, staged_exam_technique, staged_custom_sections, delete_specifications_only, activate_website, deactivate_website } = body;
    if (!project_id) throw new Error("project_id is required");

    // Get the project
    const { data: project, error: projError } = await supabase
      .from("trainer_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projError || !project) throw new Error("Project not found");

    // Handle specification-only deletion (for replace flow)
    if (delete_specifications_only) {
      const productId = project.product_id;
      if (productId) {
        const { error: delErr } = await supabase
          .from("document_chunks")
          .delete()
          .eq("product_id", productId)
          .contains("metadata", { content_type: "specification" });
        if (delErr) console.error("Error deleting spec chunks:", delErr);
        else console.log("Deleted specification chunks for product:", productId);
      }
      return new Response(JSON.stringify({ success: true, deleted: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle website activation (set product active, set up pricing)
    if (activate_website) {
      const productId = project.product_id;
      if (!productId) throw new Error("Project must be deployed before activating on website");

      // Set product as active with standard pricing
      await supabase.from("products").update({
        active: true,
        monthly_price: 699,
        lifetime_price: 2499,
      }).eq("id", productId);

      // Update project status
      await supabase.from("trainer_projects").update({
        status: "deployed",
      }).eq("id", project_id);

      console.log(`Activated product ${productId} on website`);

      return new Response(JSON.stringify({ 
        success: true, 
        product_id: productId, 
        activated: true,
        message: `${project.exam_board} ${project.subject} is now live on the website.` 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle website deactivation (remove from website)
    if (deactivate_website) {
      const productId = project.product_id;
      if (!productId) throw new Error("Project has no product to deactivate");

      await supabase.from("products").update({ active: false }).eq("id", productId);

      console.log(`Deactivated product ${productId} from website`);

      return new Response(JSON.stringify({
        success: true,
        product_id: productId,
        deactivated: true,
        message: `${project.exam_board} ${project.subject} has been removed from the website.`,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Allow re-deployment for updates after initial deploy

    let productId = project.product_id;

    if (!productId) {
      // Create the product
      const slug = `${project.exam_board}-${project.subject}`.toLowerCase().replace(/\s+/g, '-');
      const { data: newProduct, error: prodError } = await supabase
        .from("products")
        .insert({
          name: `${project.exam_board} ${project.subject}`,
          slug,
          subject: project.subject.toLowerCase(),
          exam_board: project.exam_board,
          monthly_price: 499,
          lifetime_price: 1499,
          active: false,
          system_prompt_deluxe: project.system_prompt || null,
        })
        .select("id")
        .single();

      if (prodError) throw new Error(`Failed to create product: ${prodError.message}`);
      productId = newProduct.id;
    } else {
      // Update existing product with latest system prompt and activate
      await supabase.from("products").update({
        system_prompt_deluxe: project.system_prompt || null,
        active: true,
      }).eq("id", productId);
    }

    // Save staged specification data if provided
    let specChunksCreated = 0;
    if (staged_specifications && Array.isArray(staged_specifications) && staged_specifications.length > 0) {
      console.log(`Saving ${staged_specifications.length} staged specification points...`);

      // Delete any existing spec chunks for this product first
      await supabase
        .from("document_chunks")
        .delete()
        .eq("product_id", productId)
        .contains("metadata", { content_type: "specification" });

      for (const specPoint of staged_specifications) {
        const embedding = await generateEmbedding(lovableApiKey, specPoint);
        const { error: insertErr } = await supabase.from("document_chunks").insert({
          product_id: productId,
          content: specPoint,
          embedding,
          metadata: {
            content_type: "specification",
            type: "specification",
          },
        });
        if (!insertErr) specChunksCreated++;
        else console.error("Spec chunk insert error:", insertErr);
      }

      console.log(`Saved ${specChunksCreated} specification chunks`);
    }

    // Save system prompt as training data chunk
    if (staged_system_prompt && typeof staged_system_prompt === "string" && staged_system_prompt.trim().length > 0) {
      console.log("Saving system prompt as training data...");
      await supabase
        .from("document_chunks")
        .delete()
        .eq("product_id", productId)
        .contains("metadata", { content_type: "system_prompt" });

      const embedding = await generateEmbedding(lovableApiKey, staged_system_prompt);
      await supabase.from("document_chunks").insert({
        product_id: productId,
        content: staged_system_prompt,
        embedding,
        metadata: { content_type: "system_prompt", type: "system_prompt" },
      });
    }

    // Save exam technique as training data chunk
    if (staged_exam_technique && typeof staged_exam_technique === "string" && staged_exam_technique.trim().length > 0) {
      console.log("Saving exam technique as training data...");
      await supabase
        .from("document_chunks")
        .delete()
        .eq("product_id", productId)
        .contains("metadata", { content_type: "exam_technique" });

      const embedding = await generateEmbedding(lovableApiKey, staged_exam_technique);
      await supabase.from("document_chunks").insert({
        product_id: productId,
        content: staged_exam_technique,
        embedding,
        metadata: { content_type: "exam_technique", type: "exam_technique" },
      });
    }

    // Save custom sections as training data chunks
    let customChunksCreated = 0;
    if (staged_custom_sections && Array.isArray(staged_custom_sections) && staged_custom_sections.length > 0) {
      console.log(`Saving ${staged_custom_sections.length} custom sections...`);

      // Delete existing custom section chunks for this product
      await supabase
        .from("document_chunks")
        .delete()
        .eq("product_id", productId)
        .contains("metadata", { content_type: "custom_section" });

      for (const section of staged_custom_sections) {
        const sectionName = section.name || "Custom Section";
        const sectionContent = section.content || "";
        if (sectionContent.trim().length < 10) continue;

        const chunkContent = `[${sectionName}]\n${sectionContent}`;
        const embedding = await generateEmbedding(lovableApiKey, chunkContent);
        const { error: insertErr } = await supabase.from("document_chunks").insert({
          product_id: productId,
          content: chunkContent,
          embedding,
          metadata: {
            content_type: "custom_section",
            type: "custom_section",
            section_name: sectionName,
          },
        });
        if (!insertErr) customChunksCreated++;
        else console.error("Custom section chunk insert error:", insertErr);
      }

      console.log(`Saved ${customChunksCreated} custom section chunks`);
    }

    await supabase.from("trainer_projects").update({
      status: "deployed",
      product_id: productId,
    }).eq("id", project_id);

    // Count total chunks
    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    console.log(`Deployed project ${project_id} as product ${productId} with ${count} chunks (${specChunksCreated} spec, ${customChunksCreated} custom)`);

    return new Response(JSON.stringify({
      success: true,
      product_id: productId,
      chunks_count: count,
      spec_chunks_created: specChunksCreated,
      message: `${project.exam_board} ${project.subject} deployed successfully with ${count} chunks.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Deploy error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
