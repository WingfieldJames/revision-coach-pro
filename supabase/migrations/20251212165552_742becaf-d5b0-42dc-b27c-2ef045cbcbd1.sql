-- Update prices for both Edexcel and AQA products
-- Monthly: £6.99 (699 pence), Lifetime: £34.99 (3499 pence)
UPDATE products 
SET monthly_price = 699, lifetime_price = 3499, updated_at = now()
WHERE slug IN ('edexcel-economics', 'aqa-economics');