// Shared auth guards for edge functions.
//
// Pattern copied from the correctly-authed `get-metrics-dashboard`:
//   anon client with the caller's Authorization header -> auth.getUser() -> 401
//   service-role client for privileged reads/writes and role checks -> 403
//
// RULE: always derive the acting user id from the verified token (`user.id`),
// never from a request-body `user_id`. That closes the body-param IDOR class
// (process-referral, update-streak, update-brain-profile, school-accept-invite).

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { HttpError, err } from "./http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

export interface AuthedUser {
  id: string;
  email?: string;
}

export interface AuthContext {
  user: AuthedUser;
  /** service-role client — bypasses RLS; use for privileged reads/writes. */
  admin: SupabaseClient;
}

/** Service-role client without any user context (for cron / internal use). */
export function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/**
 * Require an authenticated caller. Throws HttpError(401) if the JWT is missing
 * or invalid. Returns the verified user plus a service-role client.
 */
export async function requireUser(req: Request): Promise<AuthContext> {
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) throw new HttpError(err("Unauthorized", 401));

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user }, error } = await userClient.auth.getUser();
  if (error || !user) throw new HttpError(err("Unauthorized", 401));

  return { user: { id: user.id, email: user.email ?? undefined }, admin: serviceClient() };
}

/**
 * Best-effort auth: returns the verified user if a valid JWT is present, else
 * null (never throws on a missing/invalid token). Use for endpoints that allow
 * anonymous access but want per-user behaviour + rate limiting when logged in
 * (e.g. the logged-out /free chatbot funnel). When the anon publishable key is
 * sent as the bearer, getUser() yields no user → treated as anonymous.
 */
export async function optionalUser(req: Request): Promise<{ user: AuthedUser | null; admin: SupabaseClient }> {
  const admin = serviceClient();
  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader) return { user: null, admin };
  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: { user } } = await userClient.auth.getUser();
  return { user: user ? { id: user.id, email: user.email ?? undefined } : null, admin };
}

/** Require an authenticated admin. Throws 401 (no user) or 403 (not admin). */
export async function requireAdmin(req: Request): Promise<AuthContext> {
  const ctx = await requireUser(req);
  const { data: roleRow } = await ctx.admin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (!roleRow) throw new HttpError(err("Forbidden", 403));
  return ctx;
}

/**
 * Require an authenticated caller who owns/trains the given subject.
 * Admins always pass. Throws 401/403.
 */
export async function requireOwnedProject(req: Request, productId: string): Promise<AuthContext> {
  const ctx = await requireUser(req);

  const { data: adminRow } = await ctx.admin
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (adminRow) return ctx;

  // Ownership: the trainer_projects row for this product must belong to the caller.
  const { data: owned } = await ctx.admin
    .from("trainer_projects")
    .select("id")
    .eq("product_id", productId)
    .eq("user_id", ctx.user.id)
    .limit(1)
    .maybeSingle();
  if (!owned) throw new HttpError(err("Forbidden", 403));
  return ctx;
}

/**
 * Authorise a scheduled/internal caller (functions that legitimately run
 * without a user JWT). Accepts EITHER:
 *   - `x-cron-secret: <CRON_SECRET>`  (for new/external schedulers), or
 *   - `Authorization: Bearer <service-role key>`  (what the existing pg_cron
 *     jobs already send — see the *_schedule_*.sql migrations), so no cron
 *     reschedule is needed on cutover.
 * A public caller has neither and is rejected with 403.
 */
export function requireCronSecret(req: Request): SupabaseClient {
  const cronSecret = Deno.env.get("CRON_SECRET") || "";
  const providedSecret = req.headers.get("x-cron-secret") || "";
  const okSecret = !!cronSecret && providedSecret === cronSecret;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const bearer = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const okService = !!serviceKey && bearer === serviceKey;

  if (!okSecret && !okService) {
    throw new HttpError(err("Forbidden", 403));
  }
  return serviceClient();
}
