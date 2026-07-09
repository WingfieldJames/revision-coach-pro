-- Loop 2.3 (corrective) — drop change_log's public read under its ACTUAL prod name.
--
-- Prod is desynced from the repo migrations (Lovable-era drift: ~100 remote versions
-- have no local file). The prior migration 20260709120100 dropped a policy named
-- "Service role full access" — the name in the repo's 20260406160000 file — but in
-- PROD that policy had already been replaced (out-of-repo) by:
--   change_log:        "Admins can write change log" (ALL) + "Public can read change log" (SELECT)
--   metrics_snapshots: "Admins can view metrics" (SELECT)
-- So 20260709120100's DROPs were no-ops, and the real leak — "Public can read change
-- log", which grants public/anon SELECT on change_log — was left in place.
--
-- metrics_snapshots is already correct in prod (admin-only SELECT); nothing to do there.
-- change_log's only reader is the metrics-snapshot edge function via the service-role
-- client (bypasses RLS), and "Admins can write change log" (FOR ALL) still lets admins
-- read/write. So dropping the public read is safe.

DROP POLICY IF EXISTS "Public can read change log" ON public.change_log;
