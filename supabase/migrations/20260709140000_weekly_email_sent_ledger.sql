-- Loop 4.3 — idempotency ledger for weekly-progress-email.
--
-- The weekly recap cron had no "already sent this week" record, so a retry after a
-- partial failure (or an accidental double trigger) re-mailed every active user. This
-- table lets the function skip anyone already emailed for the current week.
--
-- Written/read only by the weekly-progress-email edge function via the service-role
-- client (bypasses RLS), so RLS is enabled with no policy → default-deny for everyone
-- else. Additive, no existing behaviour touched.

CREATE TABLE IF NOT EXISTS public.weekly_email_sent (
  user_id    uuid NOT NULL,
  week_start date NOT NULL,
  sent_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);

ALTER TABLE public.weekly_email_sent ENABLE ROW LEVEL SECURITY;
