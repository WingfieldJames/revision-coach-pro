import type { ActivityCard } from "./prepare.ts";
import type { FinalCourse } from "./results.ts";
import type { ALevel, MatchInputs, ReachLevel } from "./types.ts";
import type { PsDraft } from "./write.ts";

/**
 * The durable profile we accumulate about a student across sessions. It is
 * derived from the five stages and grows richer as they do more. `summary` is
 * the compact paragraph injected into Claude prompts so advice improves over
 * time; the structured fields are kept for future use.
 */
export interface StudentProfile {
  academic: { courseTypes: string[]; aLevels: ALevel[] };
  interests: { freeText: string };
  activities: { reflections: string[] };
  writing: { totalChars: number; perQuestion: PsDraft | null };
  summary: string;
}

export interface ProfileSources {
  matchInputs: MatchInputs | null;
  resultsFinal: FinalCourse[] | null;
  preparePool: ActivityCard[] | null;
  writeDraft: PsDraft | null;
}

const SUMMARY_LIMIT = 600;
const AMBITIOUS: ReadonlySet<ReachLevel> = new Set<ReachLevel>([
  "reach",
  "hard-reach",
]);

/** A-level slots the student has actually filled in. */
function filledALevels(inputs: MatchInputs | null): ALevel[] {
  if (!inputs) return [];
  return inputs.aLevels.filter((a) => a.subject !== "" && a.grade !== "");
}

/** The two or three most substantial reflections, longest first, trimmed. */
function topReflections(pool: ActivityCard[] | null): string[] {
  if (!pool) return [];
  return pool
    .map((c) => c.reflection.trim())
    .filter((r) => r.length > 0)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3)
    .map((r) => (r.length > 140 ? `${r.slice(0, 137)}…` : r));
}

/** Where the shortlist sits: how many courses are a genuine stretch. */
function shortlistLean(final: FinalCourse[] | null): string | null {
  if (!final || final.length === 0) return null;
  const ambitious = final.filter((c) => AMBITIOUS.has(c.reachLevel)).length;
  if (ambitious === 0) return "their shortlist sits at or below their grades";
  if (ambitious >= final.length - 1) return "their shortlist leans ambitious";
  return "their shortlist is a balanced spread of reach and safer choices";
}

/** Join sentences while staying within the character budget for prompts. */
function withinBudget(parts: string[]): string {
  let out = "";
  for (const part of parts) {
    const next = out ? `${out} ${part}` : part;
    if (next.length > SUMMARY_LIMIT) break;
    out = next;
  }
  return out;
}

/**
 * Build the profile from whatever stages the student has completed. Pure and
 * defensive — every source may be null, and a thin profile is still useful.
 */
export function deriveProfile(sources: ProfileSources): StudentProfile {
  const { matchInputs, resultsFinal, preparePool, writeDraft } = sources;

  const aLevels = filledALevels(matchInputs);
  const courseTypes = matchInputs?.subjects ?? [];
  const freeText = matchInputs?.freeText.trim() ?? "";
  const reflections = topReflections(preparePool);

  const perQuestion = writeDraft ?? null;
  const totalChars = writeDraft
    ? Object.values(writeDraft).reduce((n, v) => n + v.length, 0)
    : 0;

  // Assemble the natural-language summary, sentence by sentence, in brand voice.
  const sentences: string[] = [];

  if (aLevels.length > 0) {
    const grades = aLevels.map((a) => `${a.subject} (${a.grade})`).join(", ");
    sentences.push(`Studying ${grades}.`);
  }
  if (courseTypes.length > 0) {
    sentences.push(`Considering ${courseTypes.join(", ")}.`);
  }
  if (freeText) {
    sentences.push(`In their words: ${freeText}`);
  }
  const lean = shortlistLean(resultsFinal);
  if (lean) {
    sentences.push(`${lean[0].toUpperCase()}${lean.slice(1)}.`);
  }
  if (reflections.length > 0) {
    sentences.push(`Reflections they have noted: ${reflections.join("; ")}.`);
  }

  return {
    academic: { courseTypes, aLevels },
    interests: { freeText },
    activities: { reflections },
    writing: { totalChars, perQuestion },
    summary: withinBudget(sentences),
  };
}
