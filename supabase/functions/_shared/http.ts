// Shared HTTP helpers for edge functions.
// Replaces the CORS/JSON block copy-pasted into every function.

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  // Superset of every header any function previously allowed — includes the
  // supabase-js `x-supabase-client-*` set so browser preflights aren't blocked.
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-cron-secret, " +
    "x-supabase-client-platform, x-supabase-client-platform-version, " +
    "x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Return a preflight response for OPTIONS, else null. */
export function preflight(req: Request): Response | null {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  return null;
}

export function json(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extraHeaders },
  });
}

export function err(message: string, status = 400): Response {
  return json({ error: message }, status);
}

/**
 * An error type whose `.response` is a ready-made HTTP Response.
 * Auth/rate-limit helpers throw this so a function can do:
 *   try { ... } catch (e) { if (e instanceof HttpError) return e.response; ... }
 */
export class HttpError extends Error {
  response: Response;
  constructor(response: Response, message = "HttpError") {
    super(message);
    this.response = response;
  }
}

/** If `e` is an HttpError, return its response; otherwise return a generic 500. */
export function toResponse(e: unknown): Response {
  if (e instanceof HttpError) return e.response;
  console.error("Unhandled edge error:", e);
  return err("Internal error", 500);
}
