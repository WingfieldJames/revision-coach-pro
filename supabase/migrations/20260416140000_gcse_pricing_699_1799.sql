-- GCSE pricing update: £6.99/month, £17.99 season pass
-- A-Level pricing (£8.99/£24.99) untouched
-- Existing subscribers stay on legacy pricing (Stripe prices created inline)
UPDATE public.products
SET monthly_price = 699,
    lifetime_price = 1799,
    updated_at = now()
WHERE qualification_type = 'GCSE';
