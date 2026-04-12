UPDATE trainer_projects
SET trainer_image_url = 'fb7e4264-eb8e-429c-827e-f05e1baf4455/trainer_image_1775911898085_Passport style photo.jpeg',
    updated_at = now()
WHERE qualification_type = 'GCSE'
  AND id != 'fb7e4264-eb8e-429c-827e-f05e1baf4455'
  AND (trainer_image_url IS NULL OR trainer_image_url = '');