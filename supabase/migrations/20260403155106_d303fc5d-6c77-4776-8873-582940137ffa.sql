UPDATE trainer_projects 
SET diagram_library = (
  SELECT diagram_library 
  FROM trainer_projects 
  WHERE id = 'ced32fbd-b95d-4926-bdb1-507fc38df718'
),
updated_at = now()
WHERE subject ILIKE '%economics%' 
  AND id != 'ced32fbd-b95d-4926-bdb1-507fc38df718';