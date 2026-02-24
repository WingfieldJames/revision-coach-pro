ALTER TABLE public.trainer_projects 
  ADD COLUMN trainer_image_url text DEFAULT NULL,
  ADD COLUMN trainer_description text DEFAULT '' ,
  ADD COLUMN trainer_bio_submitted boolean NOT NULL DEFAULT false;