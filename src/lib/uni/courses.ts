import rawCourses from "./data/courses.json";
import { REGIONS, SUBJECTS } from "./constants";
import { parseOffer, parseRequiredSubject } from "./points";
import type { Course } from "./types";

const SUBJECT_IDS = new Set<string>(SUBJECTS.map((s) => s.id));
const REGION_IDS = new Set<string>(REGIONS.map((r) => r.id));

function fail(id: string, message: string): never {
  throw new Error(`Invalid course "${id}": ${message}`);
}

function validate(raw: Record<string, unknown>): Course {
  const id = typeof raw.id === "string" ? raw.id : "(unknown id)";

  for (const field of ["name", "degree", "university", "typicalOffer", "region"]) {
    if (typeof raw[field] !== "string" || raw[field] === "") {
      fail(id, `missing string field "${field}"`);
    }
  }

  if (!Array.isArray(raw.subjectTags) || raw.subjectTags.length === 0) {
    fail(id, "subjectTags must be a non-empty array");
  }
  for (const tag of raw.subjectTags as unknown[]) {
    if (typeof tag !== "string" || !SUBJECT_IDS.has(tag)) {
      fail(id, `unknown subject tag "${String(tag)}"`);
    }
  }

  if (!REGION_IDS.has(raw.region as string)) {
    fail(id, `unknown region "${String(raw.region)}"`);
  }

  // Throws if the offer contains an unrecognised grade.
  parseOffer(raw.typicalOffer as string);

  const requiredSubjects = (Array.isArray(raw.requiredSubjects)
    ? (raw.requiredSubjects as unknown[])
    : []
  ).map((entry) => {
    const parsed =
      typeof entry === "string" ? parseRequiredSubject(entry) : null;
    if (!parsed) fail(id, `unparseable requirement "${String(entry)}"`);
    return parsed;
  });

  const ucasCode =
    raw.ucasCode === null || typeof raw.ucasCode === "string"
      ? (raw.ucasCode as string | null)
      : fail(id, "ucasCode must be a string or null");

  return {
    id,
    name: raw.name as string,
    degree: raw.degree as string,
    university: raw.university as string,
    ucasCode,
    subjectTags: raw.subjectTags as string[],
    typicalOffer: raw.typicalOffer as string,
    requiredSubjects,
    usefulSubjects: Array.isArray(raw.usefulSubjects)
      ? (raw.usefulSubjects as string[])
      : [],
    region: raw.region as string,
    city: (raw.city as string) ?? "",
    campusType: (raw.campusType as string) ?? "",
    careerData: (raw.careerData as Course["careerData"]) ?? {
      notableSectors: [],
      gradOutcomeNote: null,
    },
    courseStyle: (raw.courseStyle as Course["courseStyle"]) ?? {
      placementYear: false,
      studyAbroad: false,
      orientation: "",
    },
    themes: Array.isArray(raw.themes) ? (raw.themes as string[]) : [],
    editorialNote: (raw.editorialNote as string) ?? "",
    sourceUrl: (raw.sourceUrl as string) ?? "",
    source: "curated",
    // `_verify` is intentionally dropped — internal QA notes never go downstream.
  };
}

/** The validated course set. Throws at load time on malformed data. */
export function loadCourses(): Course[] {
  return (rawCourses as Record<string, unknown>[]).map(validate);
}
