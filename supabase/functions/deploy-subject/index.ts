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
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id is required");

    // Get the project
    const { data: project, error: projError } = await supabase
      .from("trainer_projects")
      .select("*")
      .eq("id", project_id)
      .single();

    if (projError || !project) throw new Error("Project not found");
    if (project.status === "deployed") throw new Error("Project is already deployed");

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

    // Update project status
    await supabase.from("trainer_projects").update({
      status: "deployed",
      product_id: productId,
    }).eq("id", project_id);

    // Count chunks
    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    console.log(`Deployed project ${project_id} as product ${productId} with ${count} chunks`);

    return new Response(JSON.stringify({
      success: true,
      product_id: productId,
      chunks_count: count,
      message: `${project.exam_board} ${project.subject} deployed successfully. Add Stripe price IDs and routes manually.`,
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
