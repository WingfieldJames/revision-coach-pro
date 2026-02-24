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

    // Verify the caller is a trainer/admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    
    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    if (!userRoles.includes("trainer") && !userRoles.includes("admin")) {
      throw new Error("Insufficient permissions");
    }

    const { project_id } = await req.json();
    if (!project_id) throw new Error("project_id is required");

    // Get the product_id for this project
    const { data: project } = await supabase
      .from("trainer_projects")
      .select("product_id")
      .eq("id", project_id)
      .single();

    if (!project?.product_id) {
      return new Response(
        JSON.stringify({ message: "No product found — nothing to erase", deleted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Delete ALL document_chunks for this product
    const { data: deleted, error: deleteErr } = await supabase
      .from("document_chunks")
      .delete()
      .eq("product_id", project.product_id)
      .select("id");

    if (deleteErr) throw deleteErr;

    const deletedCount = deleted?.length || 0;
    console.log(`Erased ${deletedCount} chunks for product ${project.product_id}`);

    // Reset project status to draft
    await supabase
      .from("trainer_projects")
      .update({ status: "draft" })
      .eq("id", project_id);

    return new Response(
      JSON.stringify({ message: "Training data erased", deleted: deletedCount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erase error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
