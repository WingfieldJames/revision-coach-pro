import type { AnnotatedCandidate, Course } from "./types.ts";
import { REACH_LABEL } from "./tiers.ts";

/**
 * One course the reasoning step returned: which course, and the in-voice one-line
 * reason for why it fits (or stretches) this student.
 */
export interface RankedResult {
  courseId: string;
  reason: string;
}

/**
 * Ranking model. Sonnet 4.6 is a strong, fast, cost-sensible fit for ordering a
 * shortlist and writing short reasons.
 */
export const RANKING_MODEL = "claude-sonnet-4-6";

/**
 * Shared honesty framing, kept free of per-student data so the route can
 * prompt-cache it. Both the ordering and the reasons step build on this.
 */
const HOUSE_RULES = `You are an admissions adviser helping a UK sixth-former choose university courses.

Each course carries facts computed in code: how the student's predicted grades compare to the typical offer (the "reach" band), the region and city it is in, and any entry requirements they do not currently meet.

Always:
- Tie your judgement to the student's actual grades and what they said matters, including any preference about where they want to study — match that against each course's region and city.
- Be honest about reach and long-shot courses; never oversell them.
- Never invent facts you were not given: no made-up league-table positions, statistics, offers, modules, or campus details.
- Never write any personal-statement prose for the student.`;

/** System prompt for the fast ordering step — ids only, no prose. */
export const ORDER_SYSTEM = `${HOUSE_RULES}

Your task here: order every candidate course from best fit to least fit for this particular student. Return only the ordered list of course ids, via the submit_order tool. Do not write any reasons at this step.`;

/** System prompt for the reasons step — one short line per shortlisted course. */
export const REASONS_SYSTEM = `${HOUSE_RULES}

Your task here: for each course on the shortlist, write one short reason explaining why it fits, or honestly why it is a stretch.

Rules for the reasons:
- One sentence, roughly 15–25 words.
- Sentence case. UK English (organise, programme, colour). Never Title Case, never ALL CAPS, never exclamation marks.
- Understated, editorial tone — never marketing copy. No "unlock", "elevate", "transform", "game-changing".

Return your answer only by calling the submit_reasons tool.`;

/** Forced tool for the ordering step: a bare list of ids, best fit first. */
export const ORDER_TOOL = {
  name: "submit_order",
  description:
    "Submit the candidate course ids ordered best fit first for this student.",
  input_schema: {
    type: "object" as const,
    properties: {
      order: {
        type: "array",
        description:
          "Every candidate course id, ordered best fit first. Use only the ids provided.",
        items: { type: "string" },
      },
    },
    required: ["order"],
  },
};

/** Forced tool for the reasons step: one reason per shortlisted course. */
export const REASONS_TOOL = {
  name: "submit_reasons",
  description:
    "Submit a one-line reason for each shortlisted course, keyed by course id.",
  input_schema: {
    type: "object" as const,
    properties: {
      reasons: {
        type: "array",
        items: {
          type: "object",
          properties: {
            courseId: {
              type: "string",
              description: "Must be exactly one of the shortlisted course ids.",
            },
            reason: {
              type: "string",
              description:
                "One honest sentence (roughly 15–25 words) on why this course fits, or stretches, this student.",
            },
          },
          required: ["courseId", "reason"],
        },
      },
    },
    required: ["reasons"],
  },
};

/**
 * Compact, model-facing view of one candidate. Discover Uni courses carry only
 * identity facts (no offer/region/themes yet), so we send those and drop empty
 * fields rather than pad the prompt with blanks. The richer curated fields
 * return here once enrichment fills them in.
 */
function candidateForPrompt(c: AnnotatedCandidate) {
  const view: Record<string, unknown> = {
    courseId: c.course.id,
    name: c.course.name,
    degree: c.course.degree,
    university: c.course.university,
  };
  if (c.reachLevel !== "unknown") {
    view.reachBand = `${c.reachLevel} (${REACH_LABEL[c.reachLevel]})`;
    view.typicalOffer = c.course.typicalOffer;
    view.pointsVsOffer = c.pointsGap;
  }
  if (c.course.region) view.region = c.course.region;
  if (c.course.city) view.city = c.course.city;
  if (typeof c.course.typicalTariff === "number") {
    view.roughEntryTariff = c.course.typicalTariff;
  }
  if (c.missingRequirements.length > 0) {
    view.requirementsNotYetMet = c.missingRequirements.map((m) =>
      m.kind === "grade" ? `${m.subject} (needs ${m.minGrade})` : m.subject,
    );
  }
  if (c.course.themes.length > 0) view.themes = c.course.themes;
  if (c.course.careerData.notableSectors.length > 0) {
    view.notableSectors = c.course.careerData.notableSectors;
  }
  if (c.course.editorialNote) view.editorialNote = c.course.editorialNote;
  return view;
}

function studentContext(freeText: string, profileSummary?: string): string {
  const matters = freeText.trim() || "Nothing in particular was specified.";
  const known = profileSummary?.trim()
    ? `What we already know about this student (from earlier stages):\n${profileSummary.trim()}\n\n`
    : "";
  return `${known}What the student said matters to them:\n${matters}`;
}

/** User message for the ordering step. */
export function buildOrderUserMessage(
  candidates: AnnotatedCandidate[],
  freeText: string,
  profileSummary?: string,
): string {
  const courses = candidates.map(candidateForPrompt);
  return `${studentContext(freeText, profileSummary)}

Candidate courses (order all of these, best fit first):
${JSON.stringify(courses, null, 2)}`;
}

/** User message for the reasons step; candidates are the shortlist to explain. */
export function buildReasonsUserMessage(
  candidates: AnnotatedCandidate[],
  freeText: string,
  profileSummary?: string,
): string {
  const courses = candidates.map(candidateForPrompt);
  return `${studentContext(freeText, profileSummary)}

Shortlisted courses (write one reason for each):
${JSON.stringify(courses, null, 2)}`;
}

/** The match result: the candidate courses (from the live DB), the model's
 * best-fit order over them, and the true total before the candidate cap. */
export interface MatchResult {
  order: string[];
  courses: Course[];
  total: number;
}

// NB: the FirmChoice browser fetch helpers (requestOrder / requestReasons) are
// intentionally stripped — this server-side subset carries only the prompt,
// tool-schema and type constants the edge functions need.
