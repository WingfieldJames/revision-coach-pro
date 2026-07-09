-- Add an optional content_type filter to match_documents so RAG can scope
-- semantic retrieval by metadata.content_type. match_documents is currently
-- dead code (no callers), so replacing it is safe. Additive; SECURITY DEFINER
-- preserved. Requires owner sign-off before `supabase db push` (prod, no staging).
--
-- Adding a parameter changes the function signature, so the old 3-arg version is
-- dropped first (CREATE OR REPLACE cannot alter the argument list). Also adds an
-- `embedding IS NOT NULL` guard so chunks that failed to embed are skipped by the
-- vector path (the edge function sweeps those via a keyword fallback).

DROP FUNCTION IF EXISTS public.match_documents(vector, int, uuid);

CREATE OR REPLACE FUNCTION public.match_documents(
  query_embedding      vector(1536),
  match_count          int      DEFAULT 5,
  filter_product_id    uuid     DEFAULT NULL,
  filter_content_types text[]   DEFAULT NULL   -- NULL = all content types
)
RETURNS TABLE (id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id,
    dc.content,
    dc.metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.embedding IS NOT NULL
    AND (filter_product_id IS NULL OR dc.product_id = filter_product_id)
    AND (filter_content_types IS NULL
         OR dc.metadata->>'content_type' = ANY(filter_content_types))
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
