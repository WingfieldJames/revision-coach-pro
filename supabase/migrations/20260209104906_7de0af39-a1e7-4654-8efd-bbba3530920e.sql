
-- Grant Tudor Craciun lifetime access to OCR Physics Deluxe
INSERT INTO public.user_subscriptions (user_id, product_id, tier, payment_type, active, subscription_end)
VALUES (
  '292730ea-5f60-486c-9436-81323e74338a',
  'ecd5978d-3bf4-4b9c-993f-30b7f3a0f197',
  'deluxe',
  'lifetime',
  true,
  NULL
)
ON CONFLICT DO NOTHING;

-- Also update legacy users table
UPDATE public.users
SET is_premium = true, subscription_tier = 'Deluxe', payment_type = 'lifetime', subscription_end = NULL, updated_at = now()
WHERE id = '292730ea-5f60-486c-9436-81323e74338a';
