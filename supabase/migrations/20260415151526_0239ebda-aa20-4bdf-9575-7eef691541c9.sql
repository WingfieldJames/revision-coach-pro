
-- Repoint IGCSE Chemistry trainer project to the new IGCSE Chemistry product
UPDATE trainer_projects 
SET product_id = '1c7e4633-35de-4759-aebe-b1bcc88ea5f3'
WHERE id = '08a5c640-96e7-4111-8140-6444bc673029';

-- Repoint IGCSE Physics trainer project to the new IGCSE Physics product
UPDATE trainer_projects 
SET product_id = '6f621a74-7d6d-4839-8f0e-ff0e6d9a26b4'
WHERE id = 'bb123e6f-2deb-4c36-bfdd-08398fd3e0e2';
