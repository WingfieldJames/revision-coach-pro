-- =============================================================================
-- Migration: fix cron auth after edge-function hardening
-- Date: 2026-07-08
-- =============================================================================
-- Context: edge functions now enforce auth. Scheduled functions accept EITHER
-- an `x-cron-secret: <CRON_SECRET>` header OR an `Authorization: Bearer` equal
-- to the SERVICE-ROLE key (see _shared/auth.ts requireCronSecret).
--
-- Problem: the `send-feedback-emails-daily` job (migration 20260309014130) sends
-- the ANON key as its bearer, which the guard rejects (403) -> the daily job
-- would silently die after cutover. This reschedules it with the service-role
-- key, matching daily-digest / analyze-feedback-weekly.
--
-- Prerequisite (run once if not already set — see migration 20260419120000):
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xoipyycgycmpflfnrlty.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
-- Then reconnect the SQL session so the settings take effect.
--
-- Run the SQL below in Supabase Dashboard > SQL Editor as the postgres role.
-- Idempotent: cron.unschedule() guards re-runs.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

DO $$
BEGIN
  PERFORM cron.unschedule('send-feedback-emails-daily');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'send-feedback-emails-daily',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-feedback-emails',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =============================================================================
-- MANUAL STEP — dashboard-scheduled jobs not in this repo.
-- churn-detection, metrics-snapshot, conversion-nudges, exam-season-scheduler,
-- and escalate-bad-responses are scheduled via the dashboard (not in migrations),
-- so their bearer can't be verified here. If any of them send the ANON key they
-- will now 403. List every job and inspect its command:
--
--   SELECT jobname, schedule, command FROM cron.job ORDER BY jobname;
--
-- For any job whose command contains an anon-role bearer (role":"anon" in the
-- decoded JWT) or a hardcoded token, reschedule it exactly like the block above:
-- use `'Bearer ' || current_setting('app.settings.service_role_key')` for the
-- Authorization header. Jobs already using the service_role_key are fine.
-- =============================================================================
