ALTER TABLE public.trainer_projects 
  ADD COLUMN IF NOT EXISTS trainer_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS trainer_status text DEFAULT '',
  ADD COLUMN IF NOT EXISTS trainer_achievements jsonb DEFAULT '[]'::jsonb;