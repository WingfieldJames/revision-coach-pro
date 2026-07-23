import { useEffect, useState } from "react";
import {
  hasServerState,
  hydrateFromSupabase,
  seedFromLocal,
  setSyncedUser,
  SYNCED_KEYS,
} from "@/lib/uni/storage";

/**
 * Background sync for the /university section. Given the signed-in user's id,
 * brings sessionStorage into line with their uni_app_state row: a returning
 * user's saved work is pulled down (server wins over stale local work); a
 * first-time user's local work — anything they did before signing in — seeds
 * their row instead.
 *
 * Returns `hydrated`: true once storage has settled. The stage views read
 * sessionStorage synchronously on mount, so the shell must not render them
 * until this is true.
 */
export function useUniSync(userId: string | null | undefined): {
  hydrated: boolean;
} {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!userId) {
      setSyncedUser(null);
      setHydrated(false);
      // FirmChoice cleared these keys in its signOut; this app's shared
      // AuthContext knows nothing about them, so clear here instead. Without
      // this, the next account to sign in on this tab would inherit the
      // previous student's work — seedFromLocal would even write it into
      // their uni_app_state row. /university is sign-in gated, so signed-out
      // sessionStorage holds nothing worth keeping.
      for (const key of SYNCED_KEYS) sessionStorage.removeItem(key);
      return;
    }

    let active = true;
    setHydrated(false);
    setSyncedUser(userId);

    // Mirror the reconcile flow: seed the row on first sign-in, hydrate for a
    // returning user. Either way the views only mount once storage is settled.
    (async () => {
      try {
        if (await hasServerState()) {
          await hydrateFromSupabase();
        } else {
          await seedFromLocal();
        }
      } finally {
        if (active) setHydrated(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [userId]);

  return { hydrated };
}
