-- 1) API usage logs table
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid,
  feature text NOT NULL,
  model text NOT NULL DEFAULT 'google/gemini-2.5-flash',
  input_tokens integer NOT NULL DEFAULT 0,
  output_tokens integer NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(12,6) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_api_usage_logs_created_at ON public.api_usage_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON public.api_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_feature ON public.api_usage_logs (feature);

ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Admin-only SELECT
CREATE POLICY "Admins can view api usage logs"
ON public.api_usage_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- No client INSERT/UPDATE/DELETE policies (service role bypasses RLS)

-- 2) Grant admin role to jrrwingfield0@gmail.com
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE lower(u.email) = 'jrrwingfield0@gmail.com'
ON CONFLICT DO NOTHING;