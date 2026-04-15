
-- Copy IGCSE Biology diagrams to GCSE Biology
UPDATE trainer_projects
SET diagram_library = (SELECT diagram_library FROM trainer_projects WHERE id = 'fb7e4264-eb8e-429c-827e-f05e1baf4455')
WHERE id = 'de931f57-d0d1-41b4-afe4-59a82c478daf';

-- Copy IGCSE Chemistry diagrams to GCSE Chemistry
UPDATE trainer_projects
SET diagram_library = (SELECT diagram_library FROM trainer_projects WHERE id = '08a5c640-96e7-4111-8140-6444bc673029')
WHERE id = '4565a51d-70e1-4d2b-bae6-10d1edd3a6d9';
