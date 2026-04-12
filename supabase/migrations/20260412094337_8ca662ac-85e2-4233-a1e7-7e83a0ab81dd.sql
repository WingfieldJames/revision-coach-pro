-- A-Level: season pass £39.99 -> £24.99 (2499 pence), monthly stays £8.99 (899)
UPDATE products
SET lifetime_price = 2499, updated_at = now()
WHERE qualification_type = 'A Level';

-- GCSE: season pass -> £12.99 (1299 pence), monthly -> £4.99 (499 pence)
UPDATE products
SET lifetime_price = 1299, monthly_price = 499, updated_at = now()
WHERE qualification_type = 'GCSE';