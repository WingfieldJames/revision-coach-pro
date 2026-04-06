CREATE TABLE public.flagged_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.chat_messages(id) ON DELETE CASCADE UNIQUE,
  product_id UUID REFERENCES public.products(id),
  user_question TEXT,
  ai_response TEXT,
  thumbs_down_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  flagged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.flagged_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.flagged_responses FOR ALL USING (true) WITH CHECK (true);
