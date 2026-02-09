-- Update monthly price from £4.99 to £6.99 for all products still at the old price
UPDATE public.products 
SET monthly_price = 699, updated_at = now() 
WHERE monthly_price = 499;