import { pushToSupabase } from "./storage";
import { WRITE_STORAGE_KEY } from "./constants";

/**
 * The three UCAS personal statement questions (2026 entry onwards). The student
 * answers each in their own words — FirmChoice never writes statement content.
 * `id` keys the saved draft; `chars` is UCAS's overall character guidance shown
 * to the student. The combined answers must be at least 350 characters to submit
 * to UCAS, with a 4,000-character limit across all three together.
 */
export const PS_QUESTIONS = [
  {
    id: "why",
    title: "Why do you want to study this course or subject?",
  },
  {
    id: "qualifications",
    title:
      "How have your qualifications and studies helped you to prepare for this course or subject?",
  },
  {
    id: "experience",
    title:
      "What else have you done to prepare outside of education, and why are these experiences useful?",
  },
] as const;

export type PsQuestionId = (typeof PS_QUESTIONS)[number]["id"];

/** The student's draft answers, keyed by question id. */
export type PsDraft = Record<PsQuestionId, string>;

/** UCAS character limit across all three answers combined. */
export const PS_CHAR_LIMIT = 4000;

/** A fresh, empty draft with a slot for each question. */
export function emptyDraft(): PsDraft {
  return { why: "", qualifications: "", experience: "" };
}

/** Persist the draft. No-op during SSR. */
export function saveDraft(draft: PsDraft): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(WRITE_STORAGE_KEY, JSON.stringify(draft));
  pushToSupabase(WRITE_STORAGE_KEY, draft);
}

/** Read the saved draft, falling back to empty answers if absent or unparseable. */
export function loadDraft(): PsDraft {
  if (typeof window === "undefined") return emptyDraft();
  const raw = sessionStorage.getItem(WRITE_STORAGE_KEY);
  if (!raw) return emptyDraft();
  try {
    const parsed = JSON.parse(raw) as Partial<PsDraft>;
    return {
      why: typeof parsed.why === "string" ? parsed.why : "",
      qualifications:
        typeof parsed.qualifications === "string" ? parsed.qualifications : "",
      experience:
        typeof parsed.experience === "string" ? parsed.experience : "",
    };
  } catch {
    return emptyDraft();
  }
}

/** Total characters used across all three answers (UCAS counts them together). */
export function totalChars(draft: PsDraft): number {
  return draft.why.length + draft.qualifications.length + draft.experience.length;
}
