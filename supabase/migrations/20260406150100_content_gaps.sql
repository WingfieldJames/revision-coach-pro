CREATE TABLE public.content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  gaps JSONB NOT NULL DEFAULT '[]',
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

ALTER TABLE public.content_gaps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access" ON public.content_gaps FOR ALL USING (true) WITH CHECK (true);
