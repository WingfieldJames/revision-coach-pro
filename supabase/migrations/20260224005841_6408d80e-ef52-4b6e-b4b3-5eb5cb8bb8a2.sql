ALTER TABLE public.trainer_projects 
ADD COLUMN IF NOT EXISTS staged_specifications jsonb DEFAULT NULL,
ADD COLUMN IF NOT EXISTS system_prompt_submitted boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS exam_technique_submitted boolean NOT NULL DEFAULT false;