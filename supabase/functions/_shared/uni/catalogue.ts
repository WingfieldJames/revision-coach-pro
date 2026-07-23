import { loadCourses } from "./courses.ts";
import type { FinalCourse } from "./results.ts";
import type { Course } from "./types.ts";

/**
 * Catalogue courses: real Discover Uni rows a student can search and add by
 * hand, as opposed to the hand-curated `data/courses.json` set. They carry no
 * offer, subject tags or region — only identity and a rough entry tariff — so
 * the UI must present them honestly and they never enter the LLM ranker.
 */

/** The compact shape the search API returns and the shortlist persists. */
export interface CatalogueSummary {
  id: string;
  name: string;
  degree: string;
  university: string;
  ucasCode: string | null;
  /** HESA typical entry tariff (UCAS points) — a rough signal, never the offer. */
  typicalTariff: number | null;
}

/**
 * Friendly degree label from the stored `qual_level`. That column holds either a
 * real qualification parsed from the title (BA, BSc, LLB, MEng…) or the raw HESA
 * KISLEVEL code ("03", "04"). Any purely-numeric code maps to a plain label so a
 * bare "03" can never render; everything else passes through unchanged.
 */
export function degreeFromQualLevel(qualLevel: string | null | undefined): string {
  const q = (qualLevel ?? "").trim();
  if (!q || /^\d+$/.test(q)) return "Undergraduate degree";
  return q;
}

/** A row from the search route's Supabase query (institution embedded via FK). */
interface DbCourseRow {
  id: string;
  title: string | null;
  qual_level: string | null;
  ucas_code: string | null;
  typical_tariff: number | null;
  institutions:
    | { name: string | null; short_name: string | null }
    | { name: string | null; short_name: string | null }[]
    | null;
}

/** Map a raw DB row to the catalogue summary the client consumes. */
export function mapDbRow(row: DbCourseRow): CatalogueSummary {
  const inst = Array.isArray(row.institutions)
    ? row.institutions[0]
    : row.institutions;
  return {
    id: row.id,
    name: row.title ?? "Untitled course",
    degree: degreeFromQualLevel(row.qual_level),
    university: inst?.short_name || inst?.name || "Unknown institution",
    ucasCode: row.ucas_code,
    typicalTariff: row.typical_tariff,
  };
}

/** Inflate a catalogue summary into a full Course with empty curated fields. */
export function catalogueToCourse(s: CatalogueSummary): Course {
  return {
    id: s.id,
    name: s.name,
    degree: s.degree,
    university: s.university,
    ucasCode: s.ucasCode,
    subjectTags: [],
    typicalOffer: "",
    requiredSubjects: [],
    usefulSubjects: [],
    region: "",
    city: "",
    campusType: "",
    careerData: { notableSectors: [], gradOutcomeNote: null },
    courseStyle: { placementYear: false, studyAbroad: false, orientation: "" },
    themes: [],
    editorialNote: "",
    sourceUrl: "",
    source: "catalogue",
    typicalTariff: s.typicalTariff,
  };
}

/** Reduce a (catalogue) Course back to the summary we persist on the shortlist. */
export function courseToSummary(c: Course): CatalogueSummary {
  return {
    id: c.id,
    name: c.name,
    degree: c.degree,
    university: c.university,
    ucasCode: c.ucasCode,
    typicalTariff: c.typicalTariff ?? null,
  };
}

function weakKey(name: string, university: string): string {
  return `${name}|${university}`.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Drop catalogue rows that duplicate a curated course. UCAS code is the primary
 * key (institution names differ too much to trust — "LSE" vs "London School of
 * Economics"); name+university is only a weak fallback for rows missing a code.
 */
export function dedupeAgainstCurated(
  curated: Course[],
  rows: CatalogueSummary[],
): CatalogueSummary[] {
  const curatedUcas = new Set(
    curated
      .map((c) => c.ucasCode)
      .filter((u): u is string => Boolean(u))
      .map((u) => u.toUpperCase()),
  );
  const curatedWeak = new Set(curated.map((c) => weakKey(c.name, c.university)));
  return rows.filter((r) => {
    if (r.ucasCode && curatedUcas.has(r.ucasCode.toUpperCase())) return false;
    if (curatedWeak.has(weakKey(r.name, r.university))) return false;
    return true;
  });
}

/**
 * Resolve any shortlisted courseId to its Course. Curated ids come from
 * `loadCourses()`; catalogue ids are reconstructed from the snapshot persisted
 * on the shortlist, so a hand-added course is never silently dropped downstream.
 */
export function resolveCourse(finalList: FinalCourse[]): Map<string, Course> {
  const map = new Map<string, Course>();
  for (const c of loadCourses()) map.set(c.id, c);
  for (const f of finalList) {
    if (f.course && !map.has(f.course.id)) {
      map.set(f.course.id, catalogueToCourse(f.course));
    }
  }
  return map;
}
