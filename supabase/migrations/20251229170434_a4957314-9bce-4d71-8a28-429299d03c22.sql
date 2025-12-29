-- Drop the existing permissive policy that exposes all columns
DROP POLICY IF EXISTS "Anyone can view active affiliates" ON public.affiliates;

-- Create a public view with only safe fields (no email, no commission_rate)
CREATE OR REPLACE VIEW public.affiliates_public AS
SELECT id, name, code, active
FROM public.affiliates
WHERE active = true;

-- Grant access to the public view
GRANT SELECT ON public.affiliates_public TO anon, authenticated;

-- Create a restrictive policy - only service role can access the full table
-- This ensures the table itself is not directly queryable by regular users
CREATE POLICY "No public access to affiliates table"
  ON public.affiliates
  FOR SELECT
  USING (false);