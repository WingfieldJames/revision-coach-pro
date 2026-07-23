import type { SupabaseClient } from "@supabase/supabase-js";
import { catalogueToCourse, mapDbRow } from "./catalogue";
import { cahCodesForSubjects, subjectsForCahCodes } from "./cah";
import { parseRequiredSubject } from "./points";
import type { Course, MatchInputs, RequiredSubject } from "./types";

/**
 * Server-side course matching against the live Discover Uni database. Replaces
 * the curated `loadCourses()` set as the source for /api/rank and /api/reasons.
 *
 * Reads use the anon key (the caller passes the cookie-bound server client) and
 * the public-read RLS on `courses` — never the service-role key.
 */

/**
 * Most a single subject matches hundreds of courses, and the ranker can't take
 * that many — so we keep the top slice by entry tariff (a rough selectivity
 * proxy, NOT shown as the offer) and report the true total for disclosure.
 */
export const CANDIDATE_CAP = 50;

const COLUMNS =
  "id, title, qual_level, ucas_code, typical_tariff, cah_codes, offer_alevel, required_subjects, verification_status, institutions:uni_institutions(name, short_name)";

interface CandidateRow {
  id: string;
  title: string | null;
  qual_level: string | null;
  ucas_code: string | null;
  typical_tariff: number | null;
  cah_codes: string[] | null;
  offer_alevel: string | null;
  required_subjects: string | null;
  verification_status: string | null;
  institutions:
    | { name: string | null; short_name: string | null }
    | { name: string | null; short_name: string | null }[]
    | null;
}

/** Parse a "Subject (A); Subject (B)" string into requirements, dropping any bad part. */
function parseRequiredSubjects(raw: string | null): RequiredSubject[] {
  if (!raw) return [];
  return raw
    .split(";")
    .map((part) => parseRequiredSubject(part.trim()))
    .filter((r): r is RequiredSubject => r !== null);
}

/**
 * A held offer only counts once a human has verified it. A `needs_review` or
 * `unverified` row keeps the empty offer from catalogueToCourse, so its reach
 * stays `unknown` — we never present an unverified offer as the offer.
 */
function verifiedOffer(row: CandidateRow): Partial<Course> {
  if (row.verification_status !== "verified" || !row.offer_alevel) return {};
  return {
    typicalOffer: row.offer_alevel,
    requiredSubjects: parseRequiredSubjects(row.required_subjects),
  };
}

/**
 * Map a DB row to a Course: subjectTags from its CAH codes, and — only when the
 * offer is verified — the real typical offer and parsed requirements, so the
 * ranker/annotator can compute a genuine reach for it.
 */
export function mapCandidateRow(row: CandidateRow): Course {
  return {
    ...catalogueToCourse(mapDbRow(row)),
    subjectTags: subjectsForCahCodes(row.cah_codes),
    ...verifiedOffer(row),
  };
}

export interface MatchCandidates {
  /** The capped, tariff-sorted candidate set (≤ CANDIDATE_CAP). */
  courses: Course[];
  /** Total matches before the cap, for "top N of M" disclosure. */
  total: number;
}

/**
 * Candidates for a student's ticked subjects: courses whose CAH codes overlap
 * the subjects, ordered by tariff (highest first), capped to CANDIDATE_CAP.
 */
export async function fetchMatchCandidates(
  supabase: SupabaseClient,
  inputs: MatchInputs,
): Promise<MatchCandidates> {
  const codes = cahCodesForSubjects(inputs.subjects);
  if (codes.length === 0) return { courses: [], total: 0 };

  const { data, count, error } = await supabase
    .from("uni_courses")
    .select(COLUMNS, { count: "exact" })
    .overlaps("cah_codes", codes)
    .order("typical_tariff", { ascending: false, nullsFirst: false })
    .limit(CANDIDATE_CAP);
  if (error) throw new Error(`fetchMatchCandidates failed: ${error.message}`);

  const rows = (data ?? []) as unknown as CandidateRow[];
  return { courses: rows.map(mapCandidateRow), total: count ?? rows.length };
}

/** Fetch specific courses by id (for the reasons step), mapped the same way. */
export async function fetchCoursesByIds(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Course[]> {
  if (ids.length === 0) return [];
  const { data, error } = await supabase.from("uni_courses").select(COLUMNS).in("id", ids);
  if (error) throw new Error(`fetchCoursesByIds failed: ${error.message}`);
  return ((data ?? []) as unknown as CandidateRow[]).map(mapCandidateRow);
}
