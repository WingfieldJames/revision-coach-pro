INSERT INTO public.user_subscriptions
  (user_id, product_id, tier, payment_type, active, started_at, subscription_end)
VALUES
  ('55f431bb-e451-49ee-af4a-f6e6c8f4dd42','846bf6e2-334c-45fc-9e4f-e616a8115612','deluxe','lifetime', true, now(), NULL)
ON CONFLICT DO NOTHING;