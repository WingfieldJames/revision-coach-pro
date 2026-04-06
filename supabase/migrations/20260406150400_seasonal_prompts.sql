CREATE TABLE public.seasonal_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  season TEXT NOT NULL,
  guidelines TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);
ALTER TABLE public.seasonal_prompts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.seasonal_prompts FOR ALL USING (true) WITH CHECK (true);
