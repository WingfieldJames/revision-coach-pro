-- Loop 3.3 — prevent double affiliate commission on webhook retry/redelivery.
--
-- affiliate_referrals had no uniqueness on stripe_session_id, so reprocessing a
-- checkout.session.completed event (concurrent duplicate delivery, or retry after a
-- post-insert failure) booked a second commission row for the same sale. The webhook
-- now upserts with ON CONFLICT (stripe_session_id) DO NOTHING; this index makes that
-- guard real. A plain (non-partial) unique index leaves multiple NULLs allowed
-- (Postgres treats NULLs as distinct) so manual/no-session referrals are unaffected,
-- while any real Stripe session id is unique.
--
-- Verified before creation: 0 existing duplicate stripe_session_id values in prod.

CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_referral_session
  ON public.affiliate_referrals (stripe_session_id);
