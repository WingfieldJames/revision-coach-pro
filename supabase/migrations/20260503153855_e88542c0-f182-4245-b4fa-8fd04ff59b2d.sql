
-- Manually grant Dylan Irving (dylanirving040@gmail.com) Deluxe access for Edexcel Economics and Edexcel Politics
INSERT INTO public.user_subscriptions (user_id, product_id, tier, payment_type, active, stripe_customer_id, started_at, subscription_end)
VALUES
  ('dd30bab6-eb69-4c20-9e0d-42c7c18e587a', '6dc19d53-8a88-4741-9528-f25af97afb21', 'deluxe', 'lifetime', true, 'cus_URtp3ZUURfY434', now(), NULL),
  ('dd30bab6-eb69-4c20-9e0d-42c7c18e587a', '846bf6e2-334c-45fc-9e4f-e616a8115612', 'deluxe', 'lifetime', true, 'cus_URtp3ZUURfY434', now(), NULL);

-- Sync legacy users table for backward compatibility
UPDATE public.users
SET is_premium = true,
    subscription_tier = 'Deluxe',
    updated_at = now()
WHERE id = 'dd30bab6-eb69-4c20-9e0d-42c7c18e587a';
