// Port of firmchoice app/api/reasons/route.ts.
//
// Second step: write a one-line reason for each shortlisted course. Only the
// courses the student will actually see are sent, so this stays small and quick.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { preflight, json, toResponse } from "../_shared/http.ts";
import { requireUser } from "../_shared/auth.ts";
import { enforceRateLimit, userKey, RATE_LIMITS } from "../_shared/rateLimit.ts";
import { anthropicToolCall } from "../_shared/anthropicTools.ts";
import { annotateCourse } from "../_shared/uni/annotate.ts";
import { fetchCoursesByIds } from "../_shared/uni/dbCourses.ts";
import { gradesToPoints } from "../_shared/uni/points.ts";
import {
  buildReasonsUserMessage,
  RANKING_MODEL,
  REASONS_SYSTEM,
  REASONS_TOOL,
  type RankedResult,
} from "../_shared/uni/ranking.ts";
import { summarisePreferences } from "../_shared/uni/preferences.ts";
import { isMatchInputs } from "../_shared/uni/validate.ts";
import { getProfileSummary } from "../_shared/uni/profile.ts";

serve(async (req) => {
  const pre = preflight(req);
  if (pre) return pre;

  try {
    const { user, admin } = await requireUser(req);
    await enforceRateLimit(admin, { key: userKey(user.id, "uni-reasons"), ...RATE_LIMITS.cheap });

    if (!Deno.env.get("ANTHROPIC_API_KEY")) {
      return json({ error: "Reasons are not configured." }, 500);
    }

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON." }, 400);
    }

    const { inputs, courseIds } = (body ?? {}) as {
      inputs?: unknown;
      courseIds?: unknown;
    };
    if (!isMatchInputs(inputs)) {
      return json({ error: "Invalid inputs." }, 400);
    }
    if (
      !Array.isArray(courseIds) ||
      !courseIds.every((id) => typeof id === "string")
    ) {
      return json({ error: "Invalid courseIds." }, 400);
    }

    // Fetch exactly the requested courses from the live DB and annotate them
    // (reach is unknown without offers). Unresolved ids simply drop out.
    const studentPoints = gradesToPoints(inputs.aLevels.map((a) => a.grade));
    const shortlist = (await fetchCoursesByIds(admin, courseIds as string[])).map(
      (course) => annotateCourse(course, studentPoints, inputs),
    );
    if (shortlist.length === 0) {
      return json({ reasons: [] });
    }

    const profileSummary = await getProfileSummary(admin, user.id);

    try {
      const rawInput = await anthropicToolCall({
        model: RANKING_MODEL,
        system: REASONS_SYSTEM,
        tools: [REASONS_TOOL],
        toolName: REASONS_TOOL.name,
        maxTokens: 2048,
        messages: [
          {
            role: "user",
            content: buildReasonsUserMessage(
              shortlist,
              summarisePreferences(inputs),
              profileSummary,
            ),
          },
        ],
      });

      const raw = (rawInput as { reasons?: unknown })?.reasons ?? [];

      const validIds = new Set(shortlist.map((c) => c.course.id));
      const seen = new Set<string>();
      const reasons: RankedResult[] = (Array.isArray(raw) ? raw : [])
        .filter(
          (r): r is RankedResult =>
            typeof r === "object" &&
            r !== null &&
            typeof (r as RankedResult).courseId === "string" &&
            typeof (r as RankedResult).reason === "string" &&
            validIds.has((r as RankedResult).courseId),
        )
        .filter((r) => {
          if (seen.has(r.courseId)) return false;
          seen.add(r.courseId);
          return true;
        });

      return json({ reasons });
    } catch (e) {
      console.error("uni-reasons: model call failed:", e);
      return json({ error: "Reasons failed." }, 500);
    }
  } catch (e) {
    return toResponse(e);
  }
});
