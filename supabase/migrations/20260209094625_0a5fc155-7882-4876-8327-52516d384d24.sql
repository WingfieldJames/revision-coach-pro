
-- Grant Sean Han CIE Economics Deluxe access for 1 month
INSERT INTO public.user_subscriptions (user_id, product_id, tier, payment_type, subscription_end, active)
VALUES (
  'afbca939-39d4-48f2-86dd-9f95561360da',
  '9a710cf9-0523-4c1f-82c6-0e02b19087e5',
  'deluxe',
  'monthly',
  '2026-03-09T00:00:00Z',
  true
);

-- Update legacy users table
UPDATE public.users
SET is_premium = true,
    subscription_tier = 'Deluxe',
    payment_type = 'monthly',
    subscription_end = '2026-03-09T00:00:00Z'
WHERE id = 'afbca939-39d4-48f2-86dd-9f95561360da';
