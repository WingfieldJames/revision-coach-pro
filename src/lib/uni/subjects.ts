import { A_LEVEL_SUBJECTS } from "./constants";

export type Subject = { id: string; label: string };

/** The selectable A-level subjects, minus the catch-all "other" — free text
 * handles that, so it never appears as a suggestion. */
export const SELECTABLE_SUBJECTS: readonly Subject[] = A_LEVEL_SUBJECTS.filter(
  (s) => s.id !== "other",
);

/**
 * Subjects whose label contains the query (case-insensitive), prefix matches
 * first. An empty query returns the full list. Pure — unit-testable.
 */
export function filterSubjects(query: string): Subject[] {
  const q = query.trim().toLowerCase();
  if (q === "") return [...SELECTABLE_SUBJECTS];
  return SELECTABLE_SUBJECTS.filter((s) =>
    s.label.toLowerCase().includes(q),
  ).sort((a, b) => {
    const ap = a.label.toLowerCase().startsWith(q) ? 0 : 1;
    const bp = b.label.toLowerCase().startsWith(q) ? 0 : 1;
    return ap - bp;
  });
}

/** The label shown for a committed value (a subject id, or the typed "other"). */
export function subjectLabel(subject: string, otherSubject?: string): string {
  if (subject === "other") return otherSubject ?? "";
  return SELECTABLE_SUBJECTS.find((s) => s.id === subject)?.label ?? "";
}
