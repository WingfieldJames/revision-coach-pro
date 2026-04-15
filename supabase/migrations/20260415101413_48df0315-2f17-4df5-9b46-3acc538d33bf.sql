-- Set Jixuan as trainer for IGCSE Edexcel Sciences (3 projects with product_ids)
UPDATE trainer_projects 
SET 
  trainer_name = 'Jixuan',
  trainer_status = 'A-Level Student',
  trainer_description = 'Hey, I''m Jixuan. I achieved 13 Grade 9s at GCSE and I''m currently studying 4 A-Levels.

I equipped this model with the tips and tricks so that you don''t just pass your exams; rather, you can hit the top marks. This way, you can think like an examiner to help secure the highest levels in essays and write the most relevant points.',
  trainer_image_url = 'fb7e4264-eb8e-429c-827e-f05e1baf4455/trainer_image_1775911898085_Passport style photo.jpeg',
  trainer_achievements = '["13x 9s at GCSE", "90%+ in 7 subjects", "A-Levels in Mathematics, Further Mathematics, Geography, Economics"]'::jsonb,
  trainer_bio_submitted = true,
  updated_at = now()
WHERE id IN ('fb7e4264-eb8e-429c-827e-f05e1baf4455', '08a5c640-96e7-4111-8140-6444bc673029', 'bb123e6f-2deb-4c36-bfdd-08398fd3e0e2');

-- Set Naman as trainer for GCSE Edexcel Sciences (3 projects without product_ids)
UPDATE trainer_projects 
SET 
  trainer_name = 'Naman Tiwari',
  trainer_status = 'Gap Year Student',
  trainer_description = 'Hi, I''m Naman — I got A*A*A*A* at A-Level with straight 9s at GCSE and an 8.9 TMUA score. I trained A* AI on GCSE Science to help you master your exams and boost your grades.',
  trainer_image_url = '6bd8c73c-249f-4b08-b03d-7b857bab7831/trainer_image_1772193739946_Screenshot 2026-02-27 at 12.01.41.png',
  trainer_achievements = '["A*A*A*A* in Maths, Further Maths, Computer Science and Physics", "8.9 TMUA score", "Straight 9s at GCSE"]'::jsonb,
  trainer_bio_submitted = true,
  updated_at = now()
WHERE id IN ('de931f57-d0d1-41b4-afe4-59a82c478daf', '4565a51d-70e1-4d2b-bae6-10d1edd3a6d9', 'adf05afc-288a-44fd-8f3f-6ace315abbf6');