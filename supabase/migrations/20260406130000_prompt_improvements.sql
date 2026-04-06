-- Table to store AI-generated prompt improvements from feedback analysis
CREATE TABLE public.prompt_improvements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  guidelines TEXT NOT NULL,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (product_id)
);

-- RLS - only service role writes, edge functions read
ALTER TABLE public.prompt_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access"
  ON public.prompt_improvements FOR ALL
  USING (true)
  WITH CHECK (true);
