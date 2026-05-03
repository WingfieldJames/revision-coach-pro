-- 1) aleishadhalla@gmail.com — new monthly purchase, no metadata, no DB row.
INSERT INTO public.user_subscriptions
  (user_id, product_id, tier, payment_type, active, stripe_customer_id, stripe_subscription_id, started_at, subscription_end)
VALUES
  ('1485c772-ac3c-4c89-acff-3bb03fabb712','6dc19d53-8a88-4741-9528-f25af97afb21','deluxe','monthly', true,'cus_URsUUYTiLJ8ZvG','sub_1TSyjoE8sOwOumdQf8fgxreN', now(),'2026-06-03 12:01:35+00')
ON CONFLICT DO NOTHING;

UPDATE public.users
SET is_premium = true,
    subscription_tier = 'Deluxe',
    payment_type = 'monthly',
    stripe_customer_id = 'cus_URsUUYTiLJ8ZvG',
    stripe_subscription_id = 'sub_1TSyjoE8sOwOumdQf8fgxreN',
    subscription_end = '2026-06-03 12:01:35+00',
    updated_at = now()
WHERE id = '1485c772-ac3c-4c89-acff-3bb03fabb712';

-- 2) dylanirving040@gmail.com — new monthly Stripe sub on top of existing manual lifetime.
-- Attach Stripe IDs to the existing Edexcel Economics row so future renewals/cancellations
-- target the correct subscription. Keep tier=deluxe, switch payment_type to monthly.
UPDATE public.user_subscriptions
SET payment_type = 'monthly',
    stripe_customer_id = 'cus_URtp3ZUURfY434',
    stripe_subscription_id = 'sub_1TT029E8sOwOumdQxsLGb1Us',
    subscription_end = '2026-06-03 13:23:00+00',
    cancelled_at = NULL,
    active = true,
    updated_at = now()
WHERE user_id = 'dd30bab6-eb69-4c20-9e0d-42c7c18e587a'
  AND product_id = '6dc19d53-8a88-4741-9528-f25af97afb21';
