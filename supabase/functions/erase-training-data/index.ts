import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser, requireOwnedProject } from "../_shared/auth.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: verified caller first (gives us a service-role client to resolve
    // the project's product before enforcing per-project ownership).
    const { admin: supabase } = await requireUser(req);

    const { project_id } = await req.json();
    if (!project_id) return err("project_id is required", 400);

    // Get the product_id for this project
    const { data: project } = await supabase
      .from("trainer_projects")
      .select("product_id")
      .eq("id", project_id)
      .single();

    if (!project?.product_id) {
      return json({ message: "No product found — nothing to erase", deleted: 0 });
    }

    // OWNERSHIP: the caller must own/train this subject (admins bypass). Closes
    // the pre-fix hole where any trainer could wipe another subject's corpus.
    await requireOwnedProject(req, project.product_id);

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

    return json({ message: "Training data erased", deleted: deletedCount });
  } catch (error) {
    console.error("Erase error:", error);
    return toResponse(error);
  }
});
