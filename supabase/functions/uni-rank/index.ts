// Port of firmchoice app/api/rank/route.ts.
//
// Fast first step: order the candidate courses best-fit first. Candidates come
// from the live uni_courses table (top slice by tariff). Returns the candidate
// course data, the model's order, and the true match total — the client renders
// from this, then fetches prose from uni-reasons.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { anthropicToolCall } from "../_shared/anthropicTools.ts";
import { annotate } from "../_shared/uni/annotate.ts";
import { fetchMatchCandidates } from "../_shared/uni/dbCourses.ts";
import {
  buildOrderUserMessage,
  ORDER_SYSTEM,
  ORDER_TOOL,
  RANKING_MODEL,
} from "../_shared/uni/ranking.ts";
import { summarisePreferences } from "../_shared/uni/preferences.ts";
import { isMatchInputs } from "../_shared/uni/validate.ts";
import { getProfileSummary } from "../_shared/uni/profile.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    // AUTH: rank for the verified caller only — the profile summary is theirs.
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "uni-rank"), ...RATE_LIMITS.cheap });

    if (!Deno.env.get("ANTHROPIC_API_KEY")) {
      return json({ error: "Ranking is not configured." }, 500);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    const inputs = (body as { inputs?: unknown })?.inputs;
    if (!isMatchInputs(inputs)) {
      return json({ error: "Invalid inputs." }, 400);
    }

    const { courses, total } = await fetchMatchCandidates(admin, inputs);
    if (courses.length === 0) {
      return json({ order: [], courses: [], total: 0 });
    }
    const candidates = annotate(courses, inputs);

    // What we've learned about this student in earlier stages. Goes in the user
    // message only, so the cached system block stays unchanged.
    const profileSummary = await getProfileSummary(admin, user.id);

    try {
      // Up to CANDIDATE_CAP (~50) ids to emit, so give the order room — 1024
      // would truncate here.
      const rawInput = await anthropicToolCall({
        model: RANKING_MODEL,
        system: ORDER_SYSTEM,
        tools: [ORDER_TOOL],
        toolName: ORDER_TOOL.name,
        maxTokens: 4096,
        messages: [
          {
            role: "user",
            content: buildOrderUserMessage(
              candidates,
              summarisePreferences(inputs),
              profileSummary,
            ),
          },
        ],
      });

      const raw = (rawInput as { order?: unknown })?.order ?? [];

      // Keep only known candidate ids, in the model's order, deduped.
      const validIds = new Set(candidates.map((c) => c.course.id));
      const seen = new Set<string>();
      const order = (Array.isArray(raw) ? raw : [])
        .filter((id): id is string => typeof id === "string" && validIds.has(id))
        .filter((id) => {
          if (seen.has(id)) return false;
          seen.add(id);
          return true;
        });

      return json({ order, courses, total });
    } catch (e) {
      // The model call failed, but we still have the candidates — return them
      // with no order so the client falls back to a deterministic ordering.
      console.error("uni-rank: model call failed; degrading to empty order:", e);
      return json({ order: [], courses, total });
    }
  } catch (e) {
    return toResponse(e);
  }
});
