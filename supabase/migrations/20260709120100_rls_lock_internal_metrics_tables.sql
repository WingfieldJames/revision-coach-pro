-- Loop 2.3 — Lock down internal metrics tables leaked by USING(true).
--
-- change_log and metrics_snapshots (20260406160000) each carry a policy literally
-- named "Service role full access" but written as FOR ALL USING(true) WITH CHECK(true)
-- with NO role restriction. Since the service role bypasses RLS anyway, that policy
-- grants nothing to the service role and instead exposes both tables — including
-- business metrics / MRR in metrics_snapshots — to ANY authenticated user for read
-- AND write.
--
-- No src/ client code reads or writes either table (confirmed): they are populated
-- only by the metrics-snapshot edge function and read by get-metrics-dashboard, both
-- of which use the service-role client (bypasses RLS). So dropping the permissive
-- policy leaves the edge-function path untouched and default-denies everyone else.
--
-- (change_log is the one the audit named — 20260416120000_fix_admin_table_rls fixed
--  7 sibling tables but missed it; metrics_snapshots has the identical leak and is
--  fixed here in the same pass.)

DROP POLICY IF EXISTS "Service role full access" ON public.change_log;
DROP POLICY IF EXISTS "Service role full access" ON public.metrics_snapshots;

-- RLS stays ENABLED on both (from 20260406160000); with no permissive policy the
-- default is deny for every non-service-role caller. The service role is unaffected.
