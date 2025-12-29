-- Add RLS policies to affiliate_referrals table (RLS is already enabled but no policies exist)
-- This table contains sensitive business data - only allow service role access

CREATE POLICY "No public access to affiliate referrals"
  ON public.affiliate_referrals
  FOR SELECT
  USING (false);

CREATE POLICY "No public insert to affiliate referrals"
  ON public.affiliate_referrals
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "No public update to affiliate referrals"
  ON public.affiliate_referrals
  FOR UPDATE
  USING (false);

CREATE POLICY "No public delete to affiliate referrals"
  ON public.affiliate_referrals
  FOR DELETE
  USING (false);