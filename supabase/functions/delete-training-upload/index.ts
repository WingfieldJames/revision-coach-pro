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

    const { upload_id, delete_chunks } = await req.json();
    if (!upload_id) throw new Error("upload_id is required");

    // Get the upload record
    const { data: upload, error: fetchErr } = await supabase
      .from("trainer_uploads")
      .select("*")
      .eq("id", upload_id)
      .single();

    if (fetchErr || !upload) throw new Error("Upload not found");

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

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
