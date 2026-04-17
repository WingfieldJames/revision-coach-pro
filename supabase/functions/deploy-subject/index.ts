import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function generateEmbedding(lovableApiKey: string, content: string, timeoutMs = 8000): Promise<number[] | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: "text-embedding-3-small", input: content }),
      signal: controller.signal,
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.data?.[0]?.embedding || null;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      console.warn("Embedding generation timed out; continuing without embedding");
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

function sanitizeSpecPoint(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (value === null || value === undefined) return null;

  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    for (const key of ["content", "point", "text", "description", "name"]) {
      const field = obj[key];
      if (typeof field === "string" && field.trim().length > 0) {
        return field.trim();
      }
    }
    try {
      const serialized = JSON.stringify(value);
      return serialized.length > 0 ? serialized : null;
    } catch {
      return null;
    }
  }

  const fallback = String(value).trim();
  return fallback.length > 0 ? fallback : null;
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

      // Determine pricing based on qualification type
      const qualType = project.qualification_type || 'A Level';
      const isGCSE = qualType === 'GCSE';
      const activateMonthly = isGCSE ? 699 : 899;
      const activateLifetime = isGCSE ? 1799 : 2499;

      // Set product as active with appropriate pricing
      await supabase.from("products").update({
        active: true,
        monthly_price: activateMonthly,
        lifetime_price: activateLifetime,
        qualification_type: qualType,
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

    const qualType = project.qualification_type || 'A Level';
    const isGCSE = qualType === 'GCSE';
    const defaultMonthly = isGCSE ? 699 : 899;
    const defaultLifetime = isGCSE ? 1799 : 2499;

    if (!productId) {
      // Create the product
      const slugBase = `${project.exam_board}-${project.subject}`.toLowerCase().replace(/\s+/g, '-');
      const slug = isGCSE ? `gcse-${slugBase}` : slugBase;
      const { data: newProduct, error: prodError } = await supabase
        .from("products")
        .insert({
          name: `${project.exam_board} ${project.subject}`,
          slug,
          subject: project.subject.toLowerCase(),
          exam_board: project.exam_board,
          monthly_price: defaultMonthly,
          lifetime_price: defaultLifetime,
          active: false,
          system_prompt_deluxe: project.system_prompt || null,
          qualification_type: qualType,
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
        qualification_type: qualType,
      }).eq("id", productId);
    }

    // Save staged specification data if provided
    let specChunksCreated = 0;
    let specChunksFailed = 0;
    if (staged_specifications && Array.isArray(staged_specifications) && staged_specifications.length > 0) {
      const normalizedSpecPoints = staged_specifications
        .map((specPoint: unknown) => sanitizeSpecPoint(specPoint))
        .filter((specPoint): specPoint is string => !!specPoint);

      console.log(`Saving ${normalizedSpecPoints.length} staged specification points (batched)...`);

      // Delete any existing spec chunks for this product first
      await supabase
        .from("document_chunks")
        .delete()
        .eq("product_id", productId)
        .contains("metadata", { content_type: "specification" });

      // Generate embeddings in parallel batches of 10 to stay under the 150s function timeout
      // For a 300-point spec: 30 batches × ~1-2s each = ~30-60s total instead of 300 sequential waits
      const BATCH_SIZE = 10;
      const allRows: Array<{ product_id: string; content: string; embedding: number[] | null; metadata: any }> = [];

      for (let i = 0; i < normalizedSpecPoints.length; i += BATCH_SIZE) {
        const batch = normalizedSpecPoints.slice(i, i + BATCH_SIZE);
        const embeddings = await Promise.all(
          batch.map((specPoint) =>
            generateEmbedding(lovableApiKey, specPoint).catch((err) => {
              console.error(`Embedding failed for spec point (continuing with null): ${err?.message}`);
              return null;
            })
          )
        );
        batch.forEach((specPoint, idx) => {
          allRows.push({
            product_id: productId,
            content: specPoint,
            embedding: embeddings[idx],
            metadata: { content_type: "specification", type: "specification" },
          });
        });
      }

      // Bulk insert all rows in chunks of 100 (Supabase payload limit safety)
      const INSERT_BATCH_SIZE = 100;
      for (let i = 0; i < allRows.length; i += INSERT_BATCH_SIZE) {
        const rows = allRows.slice(i, i + INSERT_BATCH_SIZE);
        const { error: insertErr, count } = await supabase
          .from("document_chunks")
          .insert(rows, { count: "exact" });
        if (insertErr) {
          console.error(`Bulk spec insert failed (rows ${i}–${i + rows.length}):`, insertErr);
          specChunksFailed += rows.length;
        } else {
          specChunksCreated += count ?? rows.length;
        }
      }

      console.log(`Spec chunks: ${specChunksCreated} saved, ${specChunksFailed} failed (of ${normalizedSpecPoints.length} total)`);
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

      // Build rows with embeddings in parallel batches of 10
      const validSections = staged_custom_sections.filter(
        (s: any) => (s.content || "").trim().length >= 10
      );
      const BATCH_SIZE = 10;
      const customRows: Array<any> = [];

      for (let i = 0; i < validSections.length; i += BATCH_SIZE) {
        const batch = validSections.slice(i, i + BATCH_SIZE);
        const embeddings = await Promise.all(
          batch.map((section: any) => {
            const content = `[${section.name || "Custom Section"}]\n${section.content}`;
            return generateEmbedding(lovableApiKey, content).catch(() => null);
          })
        );
        batch.forEach((section: any, idx: number) => {
          const sectionName = section.name || "Custom Section";
          const chunkContent = `[${sectionName}]\n${section.content}`;
          customRows.push({
            product_id: productId,
            content: chunkContent,
            embedding: embeddings[idx],
            metadata: {
              content_type: "custom_section",
              type: "custom_section",
              section_name: sectionName,
            },
          });
        });
      }

      if (customRows.length > 0) {
        const { error: insertErr, count } = await supabase
          .from("document_chunks")
          .insert(customRows, { count: "exact" });
        if (insertErr) {
          console.error("Bulk custom section insert failed:", insertErr);
        } else {
          customChunksCreated = count ?? customRows.length;
        }
      }

      console.log(`Saved ${customChunksCreated} custom section chunks`);
    }

    const deployTimestamp = new Date().toISOString();
    await supabase.from("trainer_projects").update({
      status: "deployed",
      product_id: productId,
      last_deployed_at: deployTimestamp,
      updated_at: deployTimestamp,
    }).eq("id", project_id);

    // Count total chunks
    const { count } = await supabase
      .from("document_chunks")
      .select("id", { count: "exact", head: true })
      .eq("product_id", productId);

    console.log(`Deployed project ${project_id} as product ${productId} with ${count} chunks (${specChunksCreated} spec, ${customChunksCreated} custom)`);

    const isPartial = specChunksFailed > 0;
    return new Response(JSON.stringify({
      success: true,
      partial: isPartial,
      product_id: productId,
      chunks_count: count,
      spec_chunks_created: specChunksCreated,
      spec_chunks_failed: specChunksFailed,
      message: isPartial
        ? `${project.exam_board} ${project.subject} deployed with ${specChunksFailed} spec chunks failed (${specChunksCreated} saved). Check function logs.`
        : `${project.exam_board} ${project.subject} deployed successfully with ${count} chunks.`,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    const errStack = error instanceof Error ? error.stack : undefined;
    console.error("[DEPLOY-SUBJECT] Deploy error:", errMsg, errStack);
    return new Response(JSON.stringify({
      error: errMsg,
      error_type: error instanceof Error ? error.constructor.name : "Unknown",
      details: "Check Supabase function logs for full stack trace (filter by [DEPLOY-SUBJECT]).",
    }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
