import { PREFERENCE_QUESTIONS } from "./constants";
import type { MatchInputs } from "./types";

/** A short statement lead per question, so answers read as prose rather than as
 * the raw question. Keyed by PREFERENCE_QUESTIONS id. */
const LEAD: Record<string, string> = {
  location: "Where they'd like to study",
  placement: "Placement year",
  "study-abroad": "Year studying abroad",
  "course-style": "Preferred course style",
  "after-degree": "After their degree",
  priorities: "What matters most to them",
};

/**
 * Render the structured preferences plus the free-text note into one readable
 * block for the ranking model. Empty answers are skipped; an "Other" selection
 * is rendered as its typed text. Pure, and defensive against older inputs that
 * predate these fields. Returns "" when nothing was given.
 */
export function summarisePreferences(inputs: MatchInputs): string {
  const prefs = inputs.preferences ?? {};
  const other = inputs.preferenceOther ?? {};
  const lines: string[] = [];

  const custom = (inputs.customSubject ?? "").trim();
  if (custom) lines.push(`Course types they'd consider: ${custom}`);

  for (const question of PREFERENCE_QUESTIONS) {
    const selected = prefs[question.id] ?? [];
    if (selected.length === 0) continue;

    const labels = selected
      .map((id) => {
        if (id === "other") return (other[question.id] ?? "").trim();
        return question.options.find((o) => o.id === id)?.label ?? "";
      })
      .filter((label) => label !== "");
    if (labels.length === 0) continue;

    lines.push(`${LEAD[question.id] ?? question.title}: ${labels.join(", ")}.`);
  }

  const free = (inputs.freeText ?? "").trim();
  if (free) lines.push(`In their words: ${free}`);

  return lines.join("\n");
}
