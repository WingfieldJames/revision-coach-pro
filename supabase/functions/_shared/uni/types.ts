// Shared types for the Course Match flow.

/** A single grade. Empty string means "not yet chosen". */
export type Grade = "A*" | "A" | "B" | "C" | "D" | "E" | "";

/**
 * One A-level the student is taking: a subject id plus its predicted grade.
 * When `subject` is "other", `otherSubject` holds the typed-in subject name.
 */
export interface ALevel {
  subject: string;
  otherSubject?: string;
  grade: Grade;
}

/**
 * The student inputs collected in Stage 1.
 * `subjects` holds stable ids (see constants), not display labels.
 * `customSubject` is free text for a course type not in the list ("Something
 * else"); empty when unused. `aLevels` pairs each predicted grade with the
 * subject it's in, so course requirements can be verified.
 *
 * Preferences from the structured questions live in `preferences` (question id
 * to selected option ids) and `preferenceOther` (question id to the typed
 * "Other" text). `freeText` is the final "Anything else" note. All of these are
 * summarised and weighed by the ranking model. This is the shape persisted to
 * sessionStorage.
 */
export interface MatchInputs {
  subjects: string[];
  customSubject: string;
  aLevels: ALevel[];
  preferences: Record<string, string[]>;
  preferenceOther: Record<string, string>;
  freeText: string;
}

/**
 * How reachable a course is, computed from the student's points vs the offer.
 * `unknown` is for catalogue courses we hold no real offer for — reach is not
 * computed and must never be presented as if it were.
 */
export type ReachLevel = "safe" | "match" | "reach" | "hard-reach" | "unknown";

/** A parsed course requirement, e.g. { subject: "Mathematics", minGrade: "A" }. */
export interface RequiredSubject {
  subject: string;
  minGrade: Grade;
}

export interface CareerData {
  notableSectors: string[];
  gradOutcomeNote: string | null;
}

export interface CourseStyle {
  placementYear: boolean;
  studyAbroad: boolean;
  orientation: string;
}

/**
 * A course as consumed downstream: validated, with `requiredSubjects` parsed
 * into objects and the internal `_verify` note stripped by the loader.
 */
export interface Course {
  id: string;
  name: string;
  degree: string;
  university: string;
  ucasCode: string | null;
  subjectTags: string[];
  typicalOffer: string;
  requiredSubjects: RequiredSubject[];
  usefulSubjects: string[];
  region: string;
  city: string;
  campusType: string;
  careerData: CareerData;
  courseStyle: CourseStyle;
  themes: string[];
  editorialNote: string;
  sourceUrl: string;
  /**
   * Where the course came from. `curated` is the hand-built `data/courses.json`
   * set with real offers and tags (drives the match/rank flow). `catalogue` is a
   * Discover Uni row a student added by hand: real, but with no offer/tags/region
   * — its curated fields are empty and must be rendered honestly, never ranked.
   */
  source: "curated" | "catalogue";
  /**
   * HESA typical entry tariff (UCAS points) for catalogue courses — a rough
   * signal only, never shown as "the offer". Absent for curated courses.
   */
  typicalTariff?: number | null;
}

/** A requirement the student doesn't meet: either not taking the subject, or
 * taking it below the minimum grade. */
export interface MissingRequirement {
  subject: string;
  kind: "subject" | "grade";
  minGrade?: Grade;
}

/** A course plus every fact code computed about it for this student. */
export interface AnnotatedCandidate {
  course: Course;
  offerPoints: number;
  studentPoints: number;
  pointsGap: number;
  reachLevel: ReachLevel;
  missingRequirements: MissingRequirement[];
}
