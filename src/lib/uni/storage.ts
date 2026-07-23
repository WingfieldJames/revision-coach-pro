import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase as typedClient } from "@/lib/supabase";
import {
  INTAKE_STORAGE_KEY,
  ORGANISE_STORAGE_KEY,
  PREPARE_STORAGE_KEY,
  RANKING_STORAGE_KEY,
  RESULTS_STORAGE_KEY,
  WRITE_STORAGE_KEY,
} from "./constants";

/**
 * Background sync between the synchronous sessionStorage cache the UI reads from
 * and the durable uni_app_state row in Supabase. When signed out everything here
 * is a no-op and the app behaves exactly as the anonymous, local-only flow.
 */

/**
 * Maps each sessionStorage key to its column in the uni_app_state table. The
 * stages persist whole JSON blobs locally; these are the columns we mirror them
 * into when the student is signed in.
 */
export const STORAGE_COLUMNS = {
  [INTAKE_STORAGE_KEY]: "match_inputs",
  [RESULTS_STORAGE_KEY]: "results_final",
  [RANKING_STORAGE_KEY]: "results_ranking",
  [PREPARE_STORAGE_KEY]: "prepare_pool",
  [WRITE_STORAGE_KEY]: "write_draft",
  [ORGANISE_STORAGE_KEY]: "organise_arrangement",
} as const;

/** A sessionStorage key that has a matching uni_app_state column. */
export type StorageKey = keyof typeof STORAGE_COLUMNS;

/** The uni_app_state column names, in the order the keys are listed above. */
export type StorageColumn = (typeof STORAGE_COLUMNS)[StorageKey];

/** Every synced sessionStorage key. */
export const SYNCED_KEYS = Object.keys(STORAGE_COLUMNS) as StorageKey[];

// The generated Database types do not know the uni_* tables yet, so queries go
// through an untyped view of the same client. Drop this cast once the types are
// regenerated to include uni_app_state.
const supabase = typedClient as unknown as SupabaseClient;

// Cached id of the signed-in user. The auth layer keeps this current so the
// chatty save path never has to re-validate the session on every keystroke.
let currentUserId: string | null = null;

/** Called by the auth layer whenever the auth state changes. */
export function setSyncedUser(userId: string | null) {
  currentUserId = userId;
}

const TABLE = "uni_app_state";

// One debounce timer per column, so rapid edits to one stage collapse into a
// single write without delaying a different stage's save.
const timers = new Map<StorageKey, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 800;

/**
 * Mirror a freshly-saved stage value up to Supabase. Debounced per key and a
 * no-op when signed out. The value is the parsed object (not the JSON string).
 */
export function pushToSupabase(key: StorageKey, value: unknown) {
  if (!currentUserId) return;
  const column = STORAGE_COLUMNS[key];

  const existing = timers.get(key);
  if (existing) clearTimeout(existing);

  timers.set(
    key,
    setTimeout(() => {
      timers.delete(key);
      const userId = currentUserId;
      if (!userId) return;
      void supabase
        .from(TABLE)
        .upsert(
          {
            user_id: userId,
            [column]: value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
    }, DEBOUNCE_MS),
  );
}

/**
 * Pull the signed-in user's uni_app_state row and write each stored stage into
 * its sessionStorage key, so the existing synchronous load* helpers return
 * server data. No-op when signed out or when the user has no row yet.
 */
export async function hydrateFromSupabase(): Promise<void> {
  if (!currentUserId || typeof window === "undefined") return;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", currentUserId)
    .maybeSingle();

  if (error || !data) return;

  for (const key of SYNCED_KEYS) {
    const value = (data as Record<string, unknown>)[STORAGE_COLUMNS[key]];
    if (value === null || value === undefined) continue;
    sessionStorage.setItem(key, JSON.stringify(value));
  }
}

/**
 * Whether the signed-in user already has a server row. Used by the migration to
 * tell a first sign-in (seed from local) from a returning user (hydrate).
 */
export async function hasServerState(): Promise<boolean> {
  if (!currentUserId) return false;
  const { data } = await supabase
    .from(TABLE)
    .select("user_id")
    .eq("user_id", currentUserId)
    .maybeSingle();
  return Boolean(data);
}

/**
 * Seed the user's row from whatever is currently in sessionStorage — the work
 * they did anonymously before signing in. Called once on first sign-in.
 */
export async function seedFromLocal(): Promise<void> {
  if (!currentUserId || typeof window === "undefined") return;

  const row: Record<string, unknown> = {
    user_id: currentUserId,
    updated_at: new Date().toISOString(),
  };
  let hasAny = false;

  for (const key of SYNCED_KEYS) {
    const raw = sessionStorage.getItem(key);
    if (raw === null) continue;
    try {
      row[STORAGE_COLUMNS[key]] = JSON.parse(raw);
      hasAny = true;
    } catch {
      // Skip unparseable local data rather than seed garbage.
    }
  }

  if (!hasAny) return;
  await supabase.from(TABLE).upsert(row, { onConflict: "user_id" });
}
