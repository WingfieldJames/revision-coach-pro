import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, err, toResponse } from "../_shared/http.ts";
import { requireOwnedProject } from "../_shared/auth.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    let body: { product_id?: string; system_prompt?: string };
    try {
      body = await req.json();
    } catch {
      return err("Invalid JSON body", 400);
    }
    const { product_id, system_prompt } = body;
    if (!product_id || !system_prompt) {
      return err("product_id and system_prompt are required", 400);
    }

    // AUTH: caller must own/train this subject (or be an admin). Closes the
    // pre-fix hole where any anonymous caller could rewrite the AI tutor's
    // system prompt served to students.
    const { admin } = await requireOwnedProject(req, product_id);

    const { error } = await admin
      .from("products")
      .update({ system_prompt_deluxe: system_prompt })
      .eq("id", product_id);
    if (error) throw error;

    return json({ success: true, product_id, prompt_length: system_prompt.length });
  } catch (e) {
    return toResponse(e);
  }
});
