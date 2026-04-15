UPDATE trainer_projects 
SET 
  trainer_name = 'Naman Tiwari',
  trainer_status = 'Gap Year Student',
  trainer_description = 'Hi, I''m Naman — I got A*A*A*A* at A-Level with straight 9s at GCSE and an 8.9 TMUA score. I trained A* AI on GCSE Science to help you master your exams and boost your grades.',
  trainer_image_url = '6bd8c73c-249f-4b08-b03d-7b857bab7831/trainer_image_1772193739946_Screenshot 2026-02-27 at 12.01.41.png',
  trainer_achievements = '["A*A*A*A* in Maths, Further Maths, Computer Science and Physics", "8.9 TMUA score", "Straight 9s at GCSE"]'::jsonb,
  updated_at = now()
WHERE id IN ('08a5c640-96e7-4111-8140-6444bc673029', 'bb123e6f-2deb-4c36-bfdd-08398fd3e0e2');