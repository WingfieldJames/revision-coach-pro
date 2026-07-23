// Port of firmchoice app/api/organise/route.ts.
//
// Arrange the student's material into the three UCAS 2026 questions. A single
// call returning a single JSON object: every pool item routed and ordered, a
// character budget, and a gap diagnostic. Structure only — never any prose the
// student could paste in.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { anthropicToolCall } from "../_shared/anthropicTools.ts";
import { resolveCourse } from "../_shared/uni/catalogue.ts";
import {
  buildOrganiseUserMessage,
  buildShortlist,
  isActivityPool,
  isFinalList,
  ORGANISE_MODEL,
  ORGANISE_SYSTEM,
  ORGANISE_TOOL,
  validateArrangement,
  type OrganiseInput,
  type OrganiseRequest,
} from "../_shared/uni/organise.ts";
import { isMatchInputs } from "../_shared/uni/validate.ts";
import { getProfileSummary } from "../_shared/uni/profile.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "uni-organise"), ...RATE_LIMITS.cheap });

    if (!Deno.env.get("ANTHROPIC_API_KEY")) {
      return json({ error: "Organising is not configured." }, 500);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    const { inputs, finalList, pool } = (body ?? {}) as Record<string, unknown>;
    if (!isMatchInputs(inputs)) {
      return json({ error: "Invalid inputs." }, 400);
    }
    if (!isFinalList(finalList)) {
      return json({ error: "Invalid shortlist." }, 400);
    }
    if (!isActivityPool(pool)) {
      return json({ error: "Invalid pool." }, 400);
    }
    if (pool.length === 0) {
      return json({ error: "No activities to organise." }, 400);
    }

    // The guards above narrow the body to the exported request contract.
    const orgReq: OrganiseRequest = { inputs, finalList, pool };

    // Assemble the model-facing input server-side (server is authoritative).
    // resolveCourse covers curated ids and any hand-added catalogue courses
    // (snapshotted on the shortlist), so a real university name is always used.
    const byId = resolveCourse(orgReq.finalList);
    const input: OrganiseInput = {
      subjects: orgReq.inputs.subjects,
      shortlist: buildShortlist(orgReq.finalList, (id) => byId.get(id)?.university),
      pool: orgReq.pool,
    };

    const profileSummary = await getProfileSummary(admin, user.id);
    const baseMessage = buildOrganiseUserMessage(input, profileSummary);

    try {
      // One call, then one corrective retry if validation fails. Never return a
      // partial or malformed arrangement.
      let lastError = "";
      for (let attempt = 0; attempt < 2; attempt++) {
        const userText =
          attempt === 0
            ? baseMessage
            : `${baseMessage}

Your previous response was rejected: ${lastError}. Every pool card id must appear exactly once across q1, q2 and q3, with no invented ids and a non-empty reason for each. Fix this and resubmit.`;

        const rawInput = await anthropicToolCall({
          model: ORGANISE_MODEL,
          system: ORGANISE_SYSTEM,
          tools: [ORGANISE_TOOL],
          toolName: ORGANISE_TOOL.name,
          maxTokens: 4096,
          messages: [{ role: "user", content: userText }],
        });

        const result = validateArrangement(rawInput, input.pool);
        if (result.ok) {
          return json(result.value);
        }
        lastError = result.error;
      }

      return json({ error: "Could not arrange your material. Please try again." }, 502);
    } catch (e) {
      console.error("uni-organise: model call failed:", e);
      return json({ error: "Could not arrange your material. Please try again." }, 502);
    }
  } catch (e) {
    return toResponse(e);
  }
});
