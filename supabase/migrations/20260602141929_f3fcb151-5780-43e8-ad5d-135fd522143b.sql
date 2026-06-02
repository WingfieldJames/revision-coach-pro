UPDATE public.user_subscriptions
SET subscription_end = '2026-06-30T23:59:59Z',
    active = true,
    cancelled_at = NULL,
    updated_at = now()
WHERE payment_type = 'lifetime'
  AND subscription_end IS NOT NULL
  AND subscription_end < '2026-06-30T23:59:59Z';

UPDATE public.users u
SET subscription_end = '2026-06-30T23:59:59Z',
    is_premium = true,
    subscription_tier = 'Deluxe',
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.user_subscriptions s
  WHERE s.user_id = u.id
    AND s.payment_type = 'lifetime'
    AND s.subscription_end = '2026-06-30T23:59:59Z'
);