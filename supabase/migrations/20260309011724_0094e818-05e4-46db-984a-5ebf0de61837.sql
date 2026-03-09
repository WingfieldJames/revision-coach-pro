CREATE TABLE public.feedback_emails_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email_type text NOT NULL CHECK (email_type IN ('free_14d', 'deluxe_14d')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, email_type)
);

ALTER TABLE public.feedback_emails_sent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to feedback_emails_sent"
  ON public.feedback_emails_sent
  FOR ALL
  USING (false);

CREATE INDEX idx_feedback_emails_sent_user_type ON public.feedback_emails_sent (user_id, email_type);