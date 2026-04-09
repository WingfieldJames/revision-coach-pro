-- =============================================================================
-- Migration: Weekly email cron schedule + school licensing updates
-- Date: 2026-04-09
-- =============================================================================

-- 1. Enable pg_cron extension (required for scheduled jobs)
-- Note: This must be enabled from the Supabase Dashboard > Database > Extensions
-- or via: CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Schedule weekly progress email for every Monday at 8am UK time (GMT/BST)
-- Supabase pg_cron uses UTC. UK is UTC+0 in winter (GMT) and UTC+1 in summer (BST).
-- 8am BST = 7am UTC during summer, 8am GMT = 8am UTC during winter.
-- Using 7am UTC to cover BST (summer exams are the critical period).
--
-- To set this up via Supabase Dashboard > SQL Editor, run:
-- SELECT cron.schedule(
--   'weekly-progress-email',
--   '0 7 * * 1',  -- Every Monday at 07:00 UTC (08:00 BST)
--   $$
--   SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/weekly-progress-email',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
--       'Content-Type', 'application/json'
--     ),
--     body := '{}'::jsonb
--   ) AS request_id;
--   $$
-- );

-- 3. Add RLS policy for school_members to allow teachers to view progress
-- Teachers should be able to read school_licenses for their school
CREATE POLICY IF NOT EXISTS "Teachers can view their school licenses"
  ON public.school_licenses FOR SELECT
  USING (school_id IN (
    SELECT school_id FROM public.school_members
    WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')
  ));

-- 4. Allow school admins to update license seat counts
CREATE POLICY IF NOT EXISTS "School admins can update licenses"
  ON public.school_licenses FOR UPDATE
  USING (school_id IN (
    SELECT school_id FROM public.school_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));

-- 5. Allow service role to insert schools and licenses (for webhook)
-- The webhook uses service_role_key which bypasses RLS, so no policy needed.

-- 6. Add index for faster school member lookups by user
CREATE INDEX IF NOT EXISTS idx_school_members_user_status
  ON public.school_members(user_id, invite_status);

-- 7. Add index for faster subscription lookups by payment type
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_payment_type
  ON public.user_subscriptions(payment_type) WHERE active = true;
