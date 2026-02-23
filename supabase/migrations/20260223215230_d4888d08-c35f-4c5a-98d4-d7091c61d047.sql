ALTER TABLE trainer_uploads
  ADD COLUMN IF NOT EXISTS doc_type text,
  ADD COLUMN IF NOT EXISTS paper_number integer;