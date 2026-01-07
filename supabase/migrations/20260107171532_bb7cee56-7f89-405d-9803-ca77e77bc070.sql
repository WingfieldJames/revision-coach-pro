-- Allow authenticated users to validate affiliate codes during checkout
CREATE POLICY "Authenticated users can validate affiliate codes"
ON public.affiliates 
FOR SELECT
TO authenticated
USING (active = true);