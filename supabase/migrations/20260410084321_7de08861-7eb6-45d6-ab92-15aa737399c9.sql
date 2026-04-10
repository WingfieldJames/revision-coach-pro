-- Seed grade boundaries data for Edexcel Economics
UPDATE trainer_projects 
SET grade_boundaries_data = '{"2023": {"A*": 81.5, "A": 73.1, "B": 63.0}, "2024": {"A*": 83.0, "A": 74.9, "B": 64.5}, "2025": {"A*": 85.7, "A": 78.2, "B": 67.8}}'::jsonb
WHERE product_id = '6dc19d53-8a88-4741-9528-f25af97afb21' AND grade_boundaries_data IS NULL;

-- Seed grade boundaries data for AQA Economics
UPDATE trainer_projects 
SET grade_boundaries_data = '{"2023": {"A*": 82.0, "A": 73.0, "B": 62.0}, "2024": {"A*": 83.5, "A": 74.5, "B": 63.5}, "2025": {"A*": 85.0, "A": 76.0, "B": 65.0}}'::jsonb
WHERE product_id = '17ade690-8c44-4961-83b5-0edf42a9faea' AND grade_boundaries_data IS NULL;

-- Seed grade boundaries data for Edexcel Mathematics (pure)
UPDATE trainer_projects 
SET grade_boundaries_data = '{"2023": {"A*": 81.3, "A": 65.3, "B": 52.7}, "2024": {"A*": 83.7, "A": 68.3, "B": 55.7}, "2025": {"A*": 86.0, "A": 71.3, "B": 59.3}}'::jsonb
WHERE product_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' AND grade_boundaries_data IS NULL;

-- Seed grade boundaries data for Edexcel Mathematics Applied
UPDATE trainer_projects 
SET grade_boundaries_data = '{"2023": {"A*": 81.3, "A": 65.3, "B": 52.7}, "2024": {"A*": 83.7, "A": 68.3, "B": 55.7}, "2025": {"A*": 86.0, "A": 71.3, "B": 59.3}}'::jsonb
WHERE product_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d' AND grade_boundaries_data IS NULL;

-- Fix challenge end date to April 12 for all subjects (was April 11)
UPDATE trainer_projects 
SET active_challenge = jsonb_set(active_challenge, '{end}', '"2026-04-12T23:59:59Z"')
WHERE active_challenge IS NOT NULL 
  AND active_challenge->>'end' = '2026-04-11T00:00:00Z';