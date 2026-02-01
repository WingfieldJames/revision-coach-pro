-- Standardize tier metadata for all document_chunks
-- Set tier = 'free' for all chunks that currently have NULL tier
-- This ensures backwards compatibility and proper tier filtering

UPDATE public.document_chunks 
SET metadata = COALESCE(metadata, '{}'::jsonb) || '{"tier": "free"}'::jsonb
WHERE metadata->>'tier' IS NULL;