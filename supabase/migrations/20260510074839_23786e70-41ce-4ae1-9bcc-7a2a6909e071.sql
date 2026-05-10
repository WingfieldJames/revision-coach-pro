UPDATE public.trainer_projects
SET active_challenge = jsonb_set(
  active_challenge::jsonb,
  '{end}',
  to_jsonb('2026-05-12T23:59:59Z'::text),
  true
)
WHERE product_id = '6dc19d53-8a88-4741-9528-f25af97afb21'
  AND active_challenge IS NOT NULL;