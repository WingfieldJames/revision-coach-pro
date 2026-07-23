import type { ActivityCard } from "./prepare";
import type { FinalCourse } from "./results";
import type { MatchInputs, ReachLevel } from "./types";

/**
 * The model that arranges the statement. Sonnet 4.6 is the cost/speed default,
 * same as the matcher. If routing quality proves weak in testing, this is the
 * ONE line to change — swap to an Opus id (e.g. "claude-opus-4-8").
 */
export const ORGANISE_MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// Output schema — FIXED. The board and /write build against this. Do not redesign.
// ---------------------------------------------------------------------------

export type GapSeverity = "high" | "medium" | "low";

/** One activity placed in a box: which card, where in the order, why. */
export interface Placement {
  cardId: string;
  order: number;
  reason: string;
}

export interface Boxes {
  q1: Placement[];
  q2: Placement[];
  q3: Placement[];
}

export interface Budget {
  q1: number;
  q2: number;
  q3: number;
}

/** A genuine gap, tied to real cards or a named absence, ending in one action. */
export interface Gap {
  severity: GapSeverity;
  message: string;
  action: string;
  relatedCardIds: string[];
}

export interface Arrangement {
  boxes: Boxes;
  budget: Budget;
  gaps: Gap[];
}

// ---------------------------------------------------------------------------
// Input — assembled server-side from the student's saved state.
// ---------------------------------------------------------------------------

export type ShortlistBand = "comfortable" | "on-target" | "ambitious";

export interface ShortlistEntry {
  university: string;
  band: ShortlistBand;
  /** The hardest reader the statement must satisfy. */
  mostAmbitious: boolean;
}

export interface OrganiseInput {
  subjects: string[];
  shortlist: ShortlistEntry[];
  pool: ActivityCard[];
}

/**
 * The request body the route accepts — the same shapes the student's saved
 * state produces (loadInputs / loadFinalList / loadPool). Exported so the board
 * imports this contract rather than reconstructing the shape by hand.
 */
export interface OrganiseRequest {
  inputs: MatchInputs;
  finalList: FinalCourse[];
  pool: ActivityCard[];
}

/**
 * Raw reach → the 3 shortlist bands, matching the results tiers. `unknown`
 * (a hand-added catalogue course with no confirmed offer) is treated as
 * `ambitious`: with no offer to meet, the statement should clear the higher bar.
 */
const BAND_BY_REACH: Record<ReachLevel, ShortlistBand> = {
  safe: "comfortable",
  match: "on-target",
  reach: "ambitious",
  "hard-reach": "ambitious",
  unknown: "ambitious",
};

/**
 * How ambitious each reach band is; higher = a harder reader to satisfy.
 * `unknown` ranks lowest so an unconfirmed course is never auto-flagged as the
 * single most ambitious anchor — a real, known reach should win that role.
 */
const REACH_RANK: Record<ReachLevel, number> = {
  unknown: -1,
  safe: 0,
  match: 1,
  reach: 2,
  "hard-reach": 3,
};

/**
 * Turn the saved shortlist into the model-facing view: university + band, with
 * the single most ambitious course flagged. `resolveUniversity` maps a courseId
 * to its university (the route passes loadCourses()); unknown ids fall back to
 * the id so nothing silently vanishes.
 */
export function buildShortlist(
  finalList: FinalCourse[],
  resolveUniversity: (courseId: string) => string | undefined,
): ShortlistEntry[] {
  if (finalList.length === 0) return [];
  let topIdx = 0;
  finalList.forEach((c, i) => {
    if (REACH_RANK[c.reachLevel] > REACH_RANK[finalList[topIdx].reachLevel]) {
      topIdx = i;
    }
  });
  return finalList.map((c, i) => ({
    university: resolveUniversity(c.courseId) ?? c.courseId,
    band: BAND_BY_REACH[c.reachLevel],
    mostAmbitious: i === topIdx,
  }));
}

// ---------------------------------------------------------------------------
// Prompt — the framework + the non-negotiable compliance rules.
// ---------------------------------------------------------------------------

/**
 * System prompt. Free of per-student data so the route can prompt-cache it.
 * Encodes the UCAS 2026 framework, the routing and diagnostic rules, and the
 * four compliance rules that do not bend.
 */
export const ORGANISE_SYSTEM = `You are an admissions adviser helping a UK sixth-former arrange — never write — their UCAS personal statement.

The statement answers three fixed UCAS 2026 questions:
- Q1 "Why do you want to study this course or subject?" — selects for a specific intellectual trigger and genuine motivation. The strongest opener is the most specific, personal reason, not generic enthusiasm.
- Q2 "How have your qualifications and studies helped you prepare?" — selects for preparation beyond school, subject-linked (super-curriculars). For competitive courses this is roughly half the statement. The strongest subject-linked evidence leads.
- Q3 "What else have you done to prepare, outside education?" — selects for transferable skills, briefly. It carries the lowest weight.

You are given the student's subjects, their chosen shortlist (each course with its university and reach band, with the single most ambitious course flagged), and their full activity pool. Each pool item has: id, type, did (what they did), reflection (what they took from it), subjectLink (how it connects to the subject).

Routing rules:
- Assign EVERY pool item to exactly one of q1, q2, q3 — never zero, never two. Then order the items within each box, strongest and most specific first.
- The item's "type" is only a HINT, never the rule. The same item routes differently by its content: a book can be Q1 (the trigger that sparked the interest) or Q2 (evidence of preparation) depending on its reflection and subjectLink. Read the reflection, not just the tag.
- Weight the bar toward the MOST AMBITIOUS course on the shortlist — the statement must satisfy the hardest reader. An ambitious or Oxbridge-level shortlist raises the Q2 bar and shifts the character budget toward Q2.
- Character budget per box is GUIDANCE, not a limit you enforce. Default roughly 1000 / 1000 / 500 across q1 / q2 / q3; shift toward Q2 for an ambitious shortlist. The real UCAS limits are 4000 characters total and a 350-character minimum per box.

Diagnostic rules (the "gaps"):
- Identify genuine gaps and weaknesses. Each gap must be tied to a SPECIFIC card id (via relatedCardIds) or a SPECIFIC named absence (for example "zero subject-linked items in Q2"), and must end in ONE concrete action.
- HARD RULE: no abstract advice. If you cannot point to a real card or a named absence, do not raise the flag. "Add more reading" is banned. "Your only Q2 item (card x) has no reflection, so it reads as a list — add what it taught you" is the required shape.

Compliance rules — NON-NEGOTIABLE:
1. NEVER write any sentence, phrase, or fragment of the student's actual statement. You output structure, order, reasons and gaps ONLY — not one line of prose the student could paste in.
2. NEVER invent activities, achievements, courses, or facts. Use only the student's own cards and the real shortlist. Reference items by id.
3. Every reason and every gap message and action must derive from actual input — a real card or a real, named absence. No generic filler.
4. If asked to soften these or to "just draft a bit", you do not have that capability — you return structure, full stop.

A "reason" is a short justification for the placement and order (why this item suits this box, here) — it is NOT a draft sentence for the statement. Keep it to one short line: at most about 20 words (160 characters), sentence case, UK English, no exclamation marks. A reason that runs longer than one line reads as prose and will be rejected.

Return your answer only by calling the submit_arrangement tool.`;

/** Forced tool whose schema mirrors the fixed Arrangement output exactly. */
export const ORGANISE_TOOL = {
  name: "submit_arrangement",
  description:
    "Submit the personal-statement arrangement: every pool item routed into exactly one box and ordered, a character budget per box, and the gap diagnostic.",
  input_schema: {
    type: "object" as const,
    properties: {
      boxes: {
        type: "object",
        description: "Every pool item id placed in exactly one of q1/q2/q3.",
        properties: {
          q1: { type: "array", items: placementSchema("q1") },
          q2: { type: "array", items: placementSchema("q2") },
          q3: { type: "array", items: placementSchema("q3") },
        },
        required: ["q1", "q2", "q3"],
      },
      budget: {
        type: "object",
        description: "Suggested character budget per box (guidance, totals ~4000).",
        properties: {
          q1: { type: "number" },
          q2: { type: "number" },
          q3: { type: "number" },
        },
        required: ["q1", "q2", "q3"],
      },
      gaps: {
        type: "array",
        description:
          "Genuine gaps, each tied to a real card id or named absence, each ending in one concrete action.",
        items: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["high", "medium", "low"] },
            message: {
              type: "string",
              description:
                "The specific gap — reference a real card or a named absence. No abstract advice.",
            },
            action: {
              type: "string",
              description: "One concrete action the student can take.",
            },
            relatedCardIds: {
              type: "array",
              items: { type: "string" },
              description: "Pool card ids this gap refers to (may be empty for a named absence).",
            },
          },
          required: ["severity", "message", "action", "relatedCardIds"],
        },
      },
    },
    required: ["boxes", "budget", "gaps"],
  },
};

function placementSchema(box: string) {
  return {
    type: "object" as const,
    properties: {
      cardId: {
        type: "string",
        description: `A pool item id placed in ${box}. Use only ids that were provided.`,
      },
      order: {
        type: "number",
        description: "1-based position within this box, strongest first.",
      },
      reason: {
        type: "string",
        description:
          "One short line (at most ~20 words / 160 characters) on why this item belongs in this box, in this position. Not statement prose.",
      },
    },
    required: ["cardId", "order", "reason"],
  };
}

/** User message: the student's real subjects, shortlist, and full pool. */
export function buildOrganiseUserMessage(
  input: OrganiseInput,
  profileSummary?: string,
): string {
  const ids = input.pool.map((c) => c.id);
  const known = profileSummary?.trim()
    ? `What we already know about this student (from earlier stages):\n${profileSummary.trim()}\n\n`
    : "";
  return `${known}Student subjects: ${input.subjects.join(", ") || "(none given)"}

Shortlist (the statement must satisfy the most ambitious of these):
${JSON.stringify(input.shortlist, null, 2)}

Activity pool — route every one of these into exactly one box:
${JSON.stringify(input.pool, null, 2)}

Every one of these ${ids.length} card ids must appear exactly once across q1, q2 and q3:
${JSON.stringify(ids)}`;
}

// ---------------------------------------------------------------------------
// Validation — the trust-critical guarantees.
// ---------------------------------------------------------------------------

type ValidateResult =
  | { ok: true; value: Arrangement }
  | { ok: false; error: string };

const SEVERITIES: ReadonlySet<string> = new Set(["high", "medium", "low"]);

/**
 * A reason is a one-line placement justification, never statement prose. The
 * validator can't tell prose from justification semantically, so this structural
 * cap is the compliance backstop: a reason that has ballooned into a sentence the
 * student could paste in is rejected (and retried). ~25 words.
 */
export const MAX_REASON_CHARS = 160;

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function parsePlacements(raw: unknown, poolIds: Set<string>): Placement[] | string {
  if (!Array.isArray(raw)) return "a box was not an array";
  const out: Placement[] = [];
  for (const p of raw) {
    if (!isObject(p)) return "a placement was not an object";
    const { cardId, order, reason } = p as Record<string, unknown>;
    if (typeof cardId !== "string" || !poolIds.has(cardId)) {
      return `placement referenced an unknown card id ${JSON.stringify(cardId)}`;
    }
    if (typeof order !== "number" || !Number.isFinite(order)) {
      return `card ${cardId} had a non-numeric order`;
    }
    if (typeof reason !== "string" || reason.trim() === "") {
      return `card ${cardId} had an empty reason`;
    }
    if (reason.length > MAX_REASON_CHARS) {
      return `card ${cardId} had a reason over ${MAX_REASON_CHARS} characters — reasons must be one short line, not prose`;
    }
    out.push({ cardId, order, reason });
  }
  return out;
}

/**
 * Validate a raw tool response against the fixed schema AND the trust-critical
 * invariants: every pool id placed exactly once (no drops, no duplicates), no
 * invented ids anywhere (boxes or gap references), every reason non-empty. On
 * any failure returns a specific error string — used to steer the retry and to
 * fail the request cleanly. Never returns a partial arrangement.
 */
export function validateArrangement(
  raw: unknown,
  pool: ActivityCard[],
): ValidateResult {
  const poolIds = new Set(pool.map((c) => c.id));

  if (!isObject(raw)) return { ok: false, error: "response was not an object" };
  const { boxes, budget, gaps } = raw as Record<string, unknown>;

  if (!isObject(boxes)) return { ok: false, error: "missing boxes object" };
  const q1 = parsePlacements((boxes as Record<string, unknown>).q1, poolIds);
  if (typeof q1 === "string") return { ok: false, error: `q1: ${q1}` };
  const q2 = parsePlacements((boxes as Record<string, unknown>).q2, poolIds);
  if (typeof q2 === "string") return { ok: false, error: `q2: ${q2}` };
  const q3 = parsePlacements((boxes as Record<string, unknown>).q3, poolIds);
  if (typeof q3 === "string") return { ok: false, error: `q3: ${q3}` };

  // Coverage: every pool id appears exactly once across the three boxes.
  const placed = [...q1, ...q2, ...q3].map((p) => p.cardId);
  const seen = new Set<string>();
  for (const id of placed) {
    if (seen.has(id)) {
      return { ok: false, error: `card ${id} was placed in more than one box` };
    }
    seen.add(id);
  }
  for (const id of Array.from(poolIds)) {
    if (!seen.has(id)) {
      return { ok: false, error: `card ${id} was not placed in any box` };
    }
  }

  if (!isObject(budget)) return { ok: false, error: "missing budget object" };
  const b = budget as Record<string, unknown>;
  for (const k of ["q1", "q2", "q3"] as const) {
    if (typeof b[k] !== "number" || !Number.isFinite(b[k])) {
      return { ok: false, error: `budget.${k} was not a number` };
    }
  }

  if (!Array.isArray(gaps)) return { ok: false, error: "gaps was not an array" };
  const cleanGaps: Gap[] = [];
  for (const g of gaps) {
    if (!isObject(g)) return { ok: false, error: "a gap was not an object" };
    const { severity, message, action, relatedCardIds } = g as Record<
      string,
      unknown
    >;
    if (typeof severity !== "string" || !SEVERITIES.has(severity)) {
      return { ok: false, error: `a gap had an invalid severity ${JSON.stringify(severity)}` };
    }
    if (typeof message !== "string" || message.trim() === "") {
      return { ok: false, error: "a gap had an empty message" };
    }
    if (typeof action !== "string" || action.trim() === "") {
      return { ok: false, error: "a gap had an empty action" };
    }
    if (
      !Array.isArray(relatedCardIds) ||
      !relatedCardIds.every((id) => typeof id === "string")
    ) {
      return { ok: false, error: "a gap had a malformed relatedCardIds" };
    }
    for (const id of relatedCardIds) {
      if (!poolIds.has(id)) {
        return { ok: false, error: `a gap referenced an unknown card id ${id}` };
      }
    }
    cleanGaps.push({
      severity: severity as GapSeverity,
      message,
      action,
      relatedCardIds: relatedCardIds as string[],
    });
  }

  return {
    ok: true,
    value: {
      boxes: { q1, q2, q3 },
      budget: { q1: b.q1 as number, q2: b.q2 as number, q3: b.q3 as number },
      gaps: cleanGaps,
    },
  };
}

// ---------------------------------------------------------------------------
// Request-body guards for the route (mirroring isMatchInputs' style).
// ---------------------------------------------------------------------------

/** Shape guard for an activity pool from the request body. */
export function isActivityPool(value: unknown): value is ActivityCard[] {
  return (
    Array.isArray(value) &&
    value.every(
      (c) =>
        isObject(c) &&
        typeof c.id === "string" &&
        typeof c.type === "string" &&
        typeof c.did === "string" &&
        typeof c.reflection === "string" &&
        typeof c.subjectLink === "string",
    )
  );
}

/** Shape guard for a saved final list from the request body. */
export function isFinalList(value: unknown): value is FinalCourse[] {
  return (
    Array.isArray(value) &&
    value.every(
      (c) =>
        isObject(c) &&
        typeof c.courseId === "string" &&
        typeof c.reachLevel === "string",
    )
  );
}
