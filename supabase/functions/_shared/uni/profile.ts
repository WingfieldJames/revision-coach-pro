// Server adaptation of firmchoice/lib/profile/server.ts for Deno edge
// functions: no next/headers or cookies — the caller passes the service-role
// admin client and the user id it already verified from the JWT. Tables are
// prefixed `uni_` in this repo (uni_app_state / uni_student_profile).

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { deriveProfile } from "./derive.ts";

/**
 * The compact profile summary for the signed-in student, ready to drop into a
 * Claude prompt — or undefined when there's nothing to say yet.
 *
 * Derive-on-read: if the saved stages have changed since the profile was last
 * built (or it has never been built), recompute and persist it here, on the API
 * hot path. Otherwise return the stored summary untouched.
 */
export async function getProfileSummary(
  admin: SupabaseClient,
  userId: string,
): Promise<string | undefined> {
  const [{ data: state }, { data: profile }] = await Promise.all([
    admin.from("uni_app_state").select("*").eq("user_id", userId).maybeSingle(),
    admin
      .from("uni_student_profile")
      .select("summary, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  // No saved work yet — fall back to any existing summary.
  if (!state) return profile?.summary || undefined;

  const fresh =
    profile &&
    new Date(profile.updated_at).getTime() >=
      new Date(state.updated_at).getTime();
  if (fresh) return profile.summary || undefined;

  const derived = deriveProfile({
    matchInputs: state.match_inputs ?? null,
    resultsFinal: state.results_final ?? null,
    preparePool: state.prepare_pool ?? null,
    writeDraft: state.write_draft ?? null,
  });

  await admin.from("uni_student_profile").upsert(
    {
      user_id: userId,
      academic: derived.academic,
      interests: derived.interests,
      activities: derived.activities,
      writing: derived.writing,
      summary: derived.summary,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return derived.summary || undefined;
}
