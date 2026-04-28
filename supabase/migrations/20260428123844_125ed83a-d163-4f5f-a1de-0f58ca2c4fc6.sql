UPDATE public.trainer_projects
SET trainer_description = REPLACE(trainer_description, 'politics', 'Politics')
WHERE trainer_description LIKE '%politics%';

UPDATE public.trainer_projects
SET trainer_status = REPLACE(trainer_status, 'politics', 'Politics')
WHERE trainer_status LIKE '%politics%';

UPDATE public.products
SET name = REPLACE(name, 'politics', 'Politics')
WHERE name LIKE '%politics%';