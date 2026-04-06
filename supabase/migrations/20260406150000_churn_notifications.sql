CREATE TABLE public.churn_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL DEFAULT 'churn_7day',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, notification_type)
);
ALTER TABLE public.churn_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON public.churn_notifications FOR ALL USING (true) WITH CHECK (true);
