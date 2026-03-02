ALTER TABLE public.trainer_projects ADD COLUMN IF NOT EXISTS qualification_type text NOT NULL DEFAULT 'A Level';

-- Update all existing projects to 'A Level'
UPDATE public.trainer_projects SET qualification_type = 'A Level' WHERE qualification_type IS NULL OR qualification_type = '';