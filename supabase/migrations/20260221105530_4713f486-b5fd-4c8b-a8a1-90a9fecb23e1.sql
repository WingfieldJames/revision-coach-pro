DELETE FROM document_chunks 
WHERE product_id = 'f47ac10b-58cc-4372-a567-0e02b2c3d479' 
AND metadata->>'content_type' = 'specification' 
AND metadata->>'section' IN ('Statistics', 'Mechanics');