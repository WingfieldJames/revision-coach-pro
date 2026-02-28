CREATE TABLE public.user_mistakes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.products(id),
  question_text text,
  question_image_url text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  next_review_at timestamptz NOT NULL DEFAULT (now() + interval '4 days'),
  review_count integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false
);

ALTER TABLE public.user_mistakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own mistakes" ON public.user_mistakes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mistakes" ON public.user_mistakes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mistakes" ON public.user_mistakes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mistakes" ON public.user_mistakes
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_user_mistakes_user_product ON public.user_mistakes(user_id, product_id);
CREATE INDEX idx_user_mistakes_review ON public.user_mistakes(user_id, product_id, completed, next_review_at);