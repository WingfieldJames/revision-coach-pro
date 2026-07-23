import { pushToSupabase } from "./storage";
import { MAX_A_LEVELS, MIN_A_LEVELS, INTAKE_STORAGE_KEY } from "./constants";
import type { ALevel, MatchInputs } from "./types";

/** True for a plain object usable as a preferences record. */
function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** A fresh, empty set of inputs with the right number of A-level slots. */
export function emptyInputs(): MatchInputs {
  return {
    subjects: [],
    customSubject: "",
    aLevels: Array.from({ length: MIN_A_LEVELS }, (): ALevel => ({
      subject: "",
      grade: "",
    })),
    preferences: {},
    preferenceOther: {},
    freeText: "",
  };
}

/**
 * True when the student has given enough to proceed: at least one course type —
 * a ticked tag or a typed "Something else" — three to five A-level slots, and
 * every slot filled with both a subject and a grade (an "Other" subject needs a
 * typed name). Free text is optional. Pure — no browser APIs.
 */
export function isComplete(inputs: MatchInputs): boolean {
  return (
    (inputs.subjects.length > 0 || inputs.customSubject.trim() !== "") &&
    inputs.aLevels.length >= MIN_A_LEVELS &&
    inputs.aLevels.length <= MAX_A_LEVELS &&
    inputs.aLevels.every(
      (a) =>
        a.subject !== "" &&
        a.grade !== "" &&
        (a.subject !== "other" || (a.otherSubject ?? "").trim() !== ""),
    )
  );
}

/** Persist inputs for the results page. No-op during SSR. */
export function saveInputs(inputs: MatchInputs): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(INTAKE_STORAGE_KEY, JSON.stringify(inputs));
  pushToSupabase(INTAKE_STORAGE_KEY, inputs);
}

/**
 * Read persisted inputs, or null if absent, unparseable, or in an older shape
 * (e.g. before A-levels carried subjects). Guards downstream code from stale data.
 */
export function loadInputs(): MatchInputs | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(INTAKE_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MatchInputs>;
    if (
      !Array.isArray(parsed.subjects) ||
      !Array.isArray(parsed.aLevels) ||
      typeof parsed.freeText !== "string"
    ) {
      return null;
    }
    // Fields added after the first release; default them so older saved inputs
    // (which predate them) still load rather than being discarded.
    return {
      ...parsed,
      customSubject:
        typeof parsed.customSubject === "string" ? parsed.customSubject : "",
      preferences: isStringRecord(parsed.preferences) ? parsed.preferences : {},
      preferenceOther: isStringRecord(parsed.preferenceOther)
        ? parsed.preferenceOther
        : {},
    } as MatchInputs;
  } catch {
    return null;
  }
}
