-- Add spaced repetition columns to existing user_mistakes table
ALTER TABLE public.user_mistakes
  ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS mastered BOOLEAN NOT NULL DEFAULT false;

-- Update the default next_review_at to 1 day instead of 4 days for new mistakes
-- (existing rows keep their current values)
ALTER TABLE public.user_mistakes
  ALTER COLUMN next_review_at SET DEFAULT (now() + interval '1 day');
