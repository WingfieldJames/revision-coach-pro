UPDATE trainer_projects SET
  trainer_name = 'Naman Tiwari',
  trainer_status = 'Gap Year Student',
  trainer_description = 'Hi, I''m Naman — I got A*A*A*A* at A-Level with straight 9s at GCSE and an 8.9 TMUA score. I trained A* AI on Edexcel GCSE Maths to help you master every topic and exam technique.',
  trainer_image_url = '6bd8c73c-249f-4b08-b03d-7b857bab7831/trainer_image_1772193739946_Screenshot 2026-02-27 at 12.01.41.png',
  trainer_achievements = '["A*A*A*A* in Maths, Further Maths, Computer Science and Physics", "8.9 TMUA score", "Straight 9s at GCSE"]'::jsonb,
  trainer_bio_submitted = true,
  selected_features = '["my_ai","my_mistakes","grade_boundaries","exam_countdown","revision_guide","past_papers"]'::jsonb,
  updated_at = now()
WHERE id = '7dbf512d-7915-4803-956a-64d18ecd3f18';
