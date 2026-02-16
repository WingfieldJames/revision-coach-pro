-- Insert AQA Chemistry product
INSERT INTO public.products (
  name,
  slug,
  subject,
  exam_board,
  monthly_price,
  lifetime_price,
  active,
  system_prompt_free,
  system_prompt_deluxe
) VALUES (
  'AQA Chemistry',
  'aqa-chemistry',
  'Chemistry',
  'AQA',
  499,
  2499,
  true,
  NULL,
  NULL
);