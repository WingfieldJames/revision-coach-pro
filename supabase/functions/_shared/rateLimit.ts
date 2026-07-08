// Postgres fixed-window rate limiter (token-bucket-ish).
//
// One DB round-trip per call. Keyed on (bucket_key, window_start); each call
// increments the count for the current window. Simple, no new infra, good
// enough to cap per-user abuse of the expensive AI endpoints. Swap for Upstash
// later if volume demands it.

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { HttpError, json } from "./http.ts";

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfter: number; // seconds until the window resets
}

/** Common presets (requests per window). */
export const RATE_LIMITS = {
  chat: { limit: 30, windowSec: 60 },
  marking: { limit: 20, windowSec: 60 },
  ingest: { limit: 10, windowSec: 60 },
  deploy: { limit: 6, windowSec: 60 },
  cheap: { limit: 60, windowSec: 60 },
} as const;

/**
 * Increment and check a rate-limit bucket. Never throws on DB error — it
 * fails open (returns ok) so a transient DB blip can't take the app down.
 */
export async function checkRateLimit(
  admin: SupabaseClient,
  opts: { key: string; limit: number; windowSec: number },
): Promise<RateLimitResult> {
  const { key, limit, windowSec } = opts;
  // Floor "now" to the window using the DB clock via an RPC-free upsert.
  // window_start is computed from epoch seconds / windowSec on the client using
  // Date is unavailable-safe: we read the server time through a lightweight
  // insert returning the row. To avoid Date usage entirely, we bucket by a
  // coarse key derived from the Postgres now() inside the RPC below.
  try {
    const { data, error } = await admin.rpc("rate_limit_hit", {
      p_key: key,
      p_limit: limit,
      p_window_sec: windowSec,
    });
    if (error) {
      console.error("rate_limit_hit rpc error (failing open):", error.message);
      return { ok: true, remaining: limit, retryAfter: 0 };
    }
    const row = Array.isArray(data) ? data[0] : data;
    return {
      ok: !!row?.allowed,
      remaining: row?.remaining ?? 0,
      retryAfter: row?.retry_after ?? windowSec,
    };
  } catch (e) {
    console.error("rate limit failed open:", e);
    return { ok: true, remaining: limit, retryAfter: 0 };
  }
}

/** Enforce a rate limit; throws HttpError(429) if exceeded. */
export async function enforceRateLimit(
  admin: SupabaseClient,
  opts: { key: string; limit: number; windowSec: number },
): Promise<void> {
  const r = await checkRateLimit(admin, opts);
  if (!r.ok) {
    throw new HttpError(
      json(
        { error: "Rate limit exceeded. Please slow down." },
        429,
        { "Retry-After": String(r.retryAfter) },
      ),
    );
  }
}

/** Build a per-user bucket key. */
export function userKey(userId: string, fn: string): string {
  return `user:${userId}:${fn}`;
}

/** Build a per-IP bucket key for genuinely public endpoints. */
export function ipKey(req: Request, fn: string): string {
  const ip = (req.headers.get("x-forwarded-for") || "unknown").split(",")[0].trim();
  return `ip:${ip}:${fn}`;
}
