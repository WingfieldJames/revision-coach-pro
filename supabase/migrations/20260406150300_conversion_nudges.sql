CREATE TABLE public.conversion_nudges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nudge_type TEXT NOT NULL DEFAULT 'limit_hit_3days',
  product_id UUID REFERENCES public.products(id),
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, nudge_type)
);
ALTER TABLE public.conversion_nudges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.conversion_nudges FOR ALL USING (true) WITH CHECK (true);
