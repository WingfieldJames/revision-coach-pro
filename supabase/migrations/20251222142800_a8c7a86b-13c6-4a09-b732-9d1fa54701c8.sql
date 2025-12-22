-- Update all products to have lifetime_price = 2499 (£24.99) and monthly_price = 499 (£4.99)
UPDATE products SET 
  lifetime_price = 2499,
  monthly_price = 499,
  updated_at = now();