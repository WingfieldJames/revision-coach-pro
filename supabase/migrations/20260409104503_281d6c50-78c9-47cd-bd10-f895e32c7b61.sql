ALTER TABLE public.trainer_projects
  ADD COLUMN IF NOT EXISTS active_challenge jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS grade_boundaries_data jsonb DEFAULT NULL;