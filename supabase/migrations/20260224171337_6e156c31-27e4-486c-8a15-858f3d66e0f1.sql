ALTER TABLE public.trainer_projects 
ADD COLUMN exam_dates jsonb DEFAULT '[]'::jsonb;