-- =============================================================================
-- Migration: Update GCSE pricing from £4.99/£12.99 to £5.99/£14.99
-- Date: 2026-04-14
-- Note: A-Level pricing (£8.99/£24.99) is NOT changed.
--       Existing Stripe subscriptions stay on legacy pricing — this only
--       affects new checkouts (prices are created inline via price_data).
-- =============================================================================

-- GCSE monthly: 499 → 599 (£4.99 → £5.99)
-- GCSE season pass: 1299 → 1499 (£12.99 → £14.99)
UPDATE public.products
SET monthly_price = 599,
    lifetime_price = 1499,
    updated_at = now()
WHERE qualification_type = 'GCSE';
