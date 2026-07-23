import { pushToSupabase } from "./storage";
import type { CatalogueSummary } from "./catalogue";
import { RESULTS_STORAGE_KEY } from "./constants";
import type { ReachLevel } from "./types";

/**
 * One course on the student's chosen shortlist (their selected top five, in the
 * order picked). Just enough for the next stage to pick up: which course, the
 * reach band it sat in, and the reason shown (empty for courses the student
 * added themselves). Inputs are recoverable separately via loadInputs, so facts
 * can always be recomputed from the id.
 *
 * Curated courses are recovered from the id alone (`loadCourses()`). A
 * hand-added catalogue course isn't in that set, so its display data is
 * snapshotted inline in `course` — see `resolveCourse` in catalogue.ts.
 */
export interface FinalCourse {
  courseId: string;
  reachLevel: ReachLevel;
  reason: string;
  course?: CatalogueSummary;
}

/** Persist the final list for the next stage. No-op during SSR. */
export function saveFinalList(list: FinalCourse[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESULTS_STORAGE_KEY, JSON.stringify(list));
  pushToSupabase(RESULTS_STORAGE_KEY, list);
}

/** Read the persisted final list, or null if absent or unparseable. */
export function loadFinalList(): FinalCourse[] | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(RESULTS_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as FinalCourse[];
  } catch {
    return null;
  }
}
