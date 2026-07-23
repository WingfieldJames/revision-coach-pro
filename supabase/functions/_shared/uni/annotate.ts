import { A_LEVEL_SUBJECTS, GRADE_POINTS } from "./constants.ts";
import { gradesToPoints, parseOffer } from "./points.ts";
import type {
  AnnotatedCandidate,
  Course,
  Grade,
  MatchInputs,
  MissingRequirement,
  ReachLevel,
} from "./types.ts";

const LABEL_BY_ID = new Map<string, string>(
  A_LEVEL_SUBJECTS.map((s) => [s.id, s.label]),
);

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

function gradePoints(grade: Grade): number {
  return grade ? GRADE_POINTS[grade] : 0;
}

/** Every course sharing at least one of the student's ticked course-type tags. */
export function buildCandidates(courses: Course[], inputs: MatchInputs): Course[] {
  const ticked = new Set(inputs.subjects);
  return courses.filter((c) => c.subjectTags.some((t) => ticked.has(t)));
}

/**
 * Requirements the student doesn't meet: not taking the subject at all, or
 * taking it below the required grade. Empty array means every requirement is met.
 */
export function missingRequirements(
  course: Course,
  inputs: MatchInputs,
): MissingRequirement[] {
  const missing: MissingRequirement[] = [];
  for (const req of course.requiredSubjects) {
    const reqName = normalise(req.subject);
    const held = inputs.aLevels.find((al) => {
      if (al.subject === "") return false;
      const label =
        al.subject === "other"
          ? (al.otherSubject ?? "")
          : (LABEL_BY_ID.get(al.subject) ?? "");
      return normalise(label) === reqName;
    });
    if (!held) {
      missing.push({ subject: req.subject, kind: "subject" });
    } else if (gradePoints(held.grade) < gradePoints(req.minGrade)) {
      missing.push({ subject: req.subject, kind: "grade", minGrade: req.minGrade });
    }
  }
  return missing;
}

/**
 * Bucket reachability from the points gap (1 A-level grade ≈ 8 tariff points):
 * safe ≥ +8 · match 0…+7 · reach −8…−1 · hard-reach < −8.
 */
export function reachLevel(studentPoints: number, offerPoints: number): ReachLevel {
  const gap = studentPoints - offerPoints;
  if (gap >= 8) return "safe";
  if (gap >= 0) return "match";
  if (gap >= -8) return "reach";
  return "hard-reach";
}

/** Bundle every computed fact about one course for this student. */
export function annotateCourse(
  course: Course,
  studentPoints: number,
  inputs: MatchInputs,
): AnnotatedCandidate {
  // No held offer (an unenriched catalogue course, or any course missing one)
  // means reach is genuinely unknown — we never fabricate one from an empty
  // offer (that would read as "comfortable"). A verified offer populates
  // typicalOffer upstream, so such a course falls through to a real reach.
  if (course.typicalOffer === "") {
    return {
      course,
      offerPoints: 0,
      studentPoints,
      pointsGap: 0,
      reachLevel: "unknown",
      missingRequirements: [],
    };
  }

  const offerPoints = parseOffer(course.typicalOffer).points;
  return {
    course,
    offerPoints,
    studentPoints,
    pointsGap: studentPoints - offerPoints,
    reachLevel: reachLevel(studentPoints, offerPoints),
    missingRequirements: missingRequirements(course, inputs),
  };
}

/** Build the candidate set and annotate each course with deterministic facts. */
export function annotate(
  courses: Course[],
  inputs: MatchInputs,
): AnnotatedCandidate[] {
  const studentPoints = gradesToPoints(inputs.aLevels.map((a) => a.grade));
  return buildCandidates(courses, inputs).map((c) =>
    annotateCourse(c, studentPoints, inputs),
  );
}
