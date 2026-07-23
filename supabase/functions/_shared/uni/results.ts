// Pure subset of firmchoice/lib/course-match/results.ts. The sessionStorage
// helpers (saveFinalList / loadFinalList) are client-only and stripped — the
// server needs only the FinalCourse shape.

import type { CatalogueSummary } from "./catalogue.ts";
import type { ReachLevel } from "./types.ts";

/**
 * One course on the student's chosen shortlist (their selected top five, in the
 * order picked). Just enough for the next stage to pick up: which course, the
 * reach band it sat in, and the reason shown (empty for courses the student
 * added themselves).
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
