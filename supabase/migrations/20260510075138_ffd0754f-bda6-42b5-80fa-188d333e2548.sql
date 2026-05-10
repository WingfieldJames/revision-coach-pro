UPDATE public.trainer_projects
SET active_challenge = (
  SELECT active_challenge FROM public.trainer_projects
  WHERE product_id = '6dc19d53-8a88-4741-9528-f25af97afb21'
)
WHERE product_id = '17ade690-8c44-4961-83b5-0edf42a9faea';