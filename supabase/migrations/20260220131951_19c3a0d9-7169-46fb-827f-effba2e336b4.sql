-- Fix Paper 1 chunks: change content_type from 'past_paper' to 'paper_1'
UPDATE document_chunks 
SET metadata = jsonb_set(metadata, '{content_type}', '"paper_1"')
WHERE product_id = (SELECT id FROM products WHERE slug LIKE '%edexcel%econ%' LIMIT 1)
AND metadata->>'content_type' = 'past_paper'
AND metadata->>'paper' = 'Paper 1';

-- Fix Paper 2 chunks: change content_type from 'past_paper' to 'paper_2'
UPDATE document_chunks 
SET metadata = jsonb_set(metadata, '{content_type}', '"paper_2"')
WHERE product_id = (SELECT id FROM products WHERE slug LIKE '%edexcel%econ%' LIMIT 1)
AND metadata->>'content_type' = 'past_paper'
AND metadata->>'paper' = 'Paper 2';