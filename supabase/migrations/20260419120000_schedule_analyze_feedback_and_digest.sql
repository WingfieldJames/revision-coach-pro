-- =============================================================================
-- Migration: Schedule analyze-feedback (weekly) + daily-digest (daily)
-- Date: 2026-04-19
-- =============================================================================
-- Both edge functions exist but were never invoked. Without these schedules:
--   - prompt_improvements never gets populated from message_feedback
--   - astarai.official@gmail.com never receives the daily digest email
--
-- pg_cron must be enabled (Dashboard > Database > Extensions > pg_cron).
-- pg_net must also be enabled to allow net.http_post() (already used elsewhere).
--
-- Run the SQL below in Supabase Dashboard > SQL Editor as the postgres role.
-- These statements are idempotent: cron.unschedule() guards re-runs.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. Daily digest at 07:00 UTC (08:00 BST). Sends usage email to astarai.official@gmail.com.
DO $$
BEGIN
  PERFORM cron.unschedule('daily-digest');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'daily-digest',
  '0 7 * * *',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/daily-digest',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- 2. Analyze feedback weekly (Monday 06:00 UTC). Generates prompt_improvements
--    rows from thumbs-down feedback and injects them into rag-chat system prompts.
DO $$
BEGIN
  PERFORM cron.unschedule('analyze-feedback-weekly');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'analyze-feedback-weekly',
  '0 6 * * 1',
  $$
  SELECT net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/analyze-feedback',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- =============================================================================
-- One-time setup (run once in SQL Editor if app.settings.* are not yet defined):
--
--   ALTER DATABASE postgres SET app.settings.supabase_url = 'https://xoipyycgycmpflfnrlty.supabase.co';
--   ALTER DATABASE postgres SET app.settings.service_role_key = '<service-role-key>';
--
-- After running, reconnect your SQL session for the settings to take effect.
-- =============================================================================
