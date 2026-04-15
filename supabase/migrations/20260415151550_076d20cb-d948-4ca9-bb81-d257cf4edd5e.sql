
-- Copy IGCSE Chemistry system prompt
UPDATE products 
SET system_prompt_deluxe = (SELECT system_prompt_deluxe FROM products WHERE slug = 'edexcel-chemistry' AND qualification_type = 'GCSE')
WHERE slug = 'edexcel-igcse-chemistry';

-- Copy IGCSE Physics system prompt
UPDATE products 
SET system_prompt_deluxe = (SELECT system_prompt_deluxe FROM products WHERE slug = 'edexcel-physics' AND qualification_type = 'GCSE')
WHERE slug = 'edexcel-igcse-physics';
