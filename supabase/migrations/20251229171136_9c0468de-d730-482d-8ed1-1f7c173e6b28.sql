-- Drop and recreate the view with SECURITY INVOKER (default, but explicit is better)
DROP VIEW IF EXISTS public.affiliates_public;

CREATE VIEW public.affiliates_public 
WITH (security_invoker = true) AS
SELECT id, name, code, active
FROM public.affiliates
WHERE active = true;

-- Grant access to the public view
GRANT SELECT ON public.affiliates_public TO anon, authenticated;