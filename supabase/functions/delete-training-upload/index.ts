import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireUser, requireOwnedProject, requireAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: verified caller first; ownership is enforced below against the
    // upload's owning project.
    const { admin: supabase } = await requireUser(req);

    const { upload_id, delete_chunks } = await req.json();
    if (!upload_id) return err("upload_id is required", 400);

    // Get the upload record
    const { data: upload, error: fetchErr } = await supabase
      .from("trainer_uploads")
      .select("*")
      .eq("id", upload_id)
      .single();

    if (fetchErr || !upload) return err("Upload not found", 400);

    // OWNERSHIP: the upload belongs to a trainer_project; resolve its product
    // and require the caller to own/train that subject (admins bypass). If no
    // product is linked we cannot cheaply establish ownership, so fall back to
    // admin-only.
    const { data: ownerProject } = await supabase
      .from("trainer_projects")
      .select("product_id")
      .eq("id", upload.project_id)
      .single();

    if (ownerProject?.product_id) {
      await requireOwnedProject(req, ownerProject.product_id);
    } else {
      await requireAdmin(req);
    }

    // If delete_chunks is true, also delete associated document_chunks
    // Chunks are linked by metadata matching this upload's details
    if (delete_chunks) {
      // Get the project to find product_id
      const { data: project } = await supabase
        .from("trainer_projects")
        .select("product_id")
        .eq("id", upload.project_id)
        .single();

      if (project?.product_id) {
        // Delete chunks that match this file's year, doc_type, paper_number
        const { data: chunks } = await supabase
          .from("document_chunks")
          .select("id, metadata")
          .eq("product_id", project.product_id);

        if (chunks) {
          const chunkIdsToDelete = chunks
            .filter((c: any) => {
              const meta = c.metadata as any;
              if (!meta) return false;
              // Match by year and paper_number and doc_type
              if (meta.year === upload.year && meta.paper_number === upload.paper_number) {
                // If it's a merged chunk, delete it if either QP or MS matches
                if (meta.content_type === "past_paper" || meta.type === "past_paper") return true;
              }
              return false;
            })
            .map((c: any) => c.id);

          if (chunkIdsToDelete.length > 0) {
            await supabase.from("document_chunks").delete().in("id", chunkIdsToDelete);
          }
        }
      }
    }

    // Delete from storage
    if (upload.file_url) {
      await supabase.storage.from("trainer-uploads").remove([upload.file_url]);
    }

    // Delete the DB record
    const { error: delErr } = await supabase
      .from("trainer_uploads")
      .delete()
      .eq("id", upload_id);

    if (delErr) throw delErr;

    return json({ success: true });
  } catch (err) {
    return toResponse(err);
  }
});
