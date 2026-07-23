import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedClient } from "@/lib/supabase";
import { mapDbRow, type CatalogueSummary } from "./catalogue";

// The generated Database types do not know the uni_* tables yet, so queries go
// through an untyped view of the same client. Drop this cast once the types are
// regenerated to include uni_courses / uni_institutions.
const supabase = typedClient as unknown as SupabaseClient;

const LIMIT = 10;

/**
 * Search the live Discover Uni catalogue by course title or university name.
 * Public data: runs on the browser client via the read-only RLS policy on
 * `uni_courses` — never the service-role key. Returns the compact catalogue
 * summaries the AddCourse UI consumes (empty array on short/failed queries).
 */
export async function searchCourses(query: string): Promise<CatalogueSummary[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  // Neutralise PostgREST filter metacharacters before building the pattern.
  const term = q.replace(/[%,()*]/g, " ").trim();
  if (term.length < 2) return [];
  const pattern = `%${term}%`;

  const columns = "id, title, qual_level, ucas_code, typical_tariff";

  // Two narrow queries — by course title, and by institution name — then merge.
  // (Filtering across an embedded table in one OR is awkward in PostgREST.)
  const [byTitle, byUni] = await Promise.all([
    supabase
      .from("uni_courses")
      .select(`${columns}, institutions:uni_institutions(name, short_name)`)
      .ilike("title", pattern)
      .limit(LIMIT),
    supabase
      .from("uni_courses")
      .select(`${columns}, institutions:uni_institutions!inner(name, short_name)`)
      .ilike("institutions.name", pattern)
      .limit(LIMIT),
  ]);

  if (byTitle.error && byUni.error) {
    throw new Error("Search failed.");
  }

  const merged = [...(byTitle.data ?? []), ...(byUni.data ?? [])];
  const byId = new Map<string, (typeof merged)[number]>();
  for (const row of merged) if (!byId.has(row.id)) byId.set(row.id, row);

  return Array.from(byId.values())
    .slice(0, LIMIT)
    .map((row) => mapDbRow(row as unknown as Parameters<typeof mapDbRow>[0]));
}
