// Pure subset of firmchoice/lib/course-match/write.ts. The sessionStorage
// helpers (saveDraft / loadDraft) are client-only and stripped — the server
// needs only the PsDraft shape and the question metadata.

/**
 * The three UCAS personal statement questions (2026 entry onwards). The student
 * answers each in their own words — never write statement content for them.
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

/** Total characters used across all three answers (UCAS counts them together). */
export function totalChars(draft: PsDraft): number {
  return draft.why.length + draft.qualifications.length + draft.experience.length;
}
