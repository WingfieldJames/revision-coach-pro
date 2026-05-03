INSERT INTO public.user_subscriptions
  (user_id, product_id, tier, payment_type, active, stripe_customer_id, stripe_subscription_id, started_at, subscription_end)
VALUES
  ('67845605-5a97-498c-b0e7-433d15b3954b','6dc19d53-8a88-4741-9528-f25af97afb21','deluxe','monthly',  true,'cus_URumWdoicKFx24','sub_1TT0woE8sOwOumdQhzBfHiuT', now(),'2026-06-03 14:24:42+00'),
  ('aafac768-c2c7-4edf-a861-9fcf64320cdb','6dc19d53-8a88-4741-9528-f25af97afb21','deluxe','lifetime', true, NULL, NULL, now(), NULL),
  ('1ec06d83-ca48-481b-a61c-815cebf0e9e0','17ade690-8c44-4961-83b5-0edf42a9faea','deluxe','monthly',  true,'cus_URsWHrJBHyRxRN','sub_1TSylKE8sOwOumdQOn1Mm0zn', now(),'2026-06-03 12:04:42+00'),
  ('55f431bb-e451-49ee-af4a-f6e6c8f4dd42','6dc19d53-8a88-4741-9528-f25af97afb21','deluxe','monthly',  true,'cus_URsSXlFi7GGdsH','sub_1TSyhFE8sOwOumdQCVeeV3mG', now(),'2026-06-03 12:00:29+00'),
  ('f6090ac5-3721-49b7-a7e4-ca0aa7fcbfd3','6dc19d53-8a88-4741-9528-f25af97afb21','deluxe','lifetime', true, NULL, NULL, now(), NULL);

UPDATE public.users SET is_premium = true, subscription_tier = 'Deluxe', updated_at = now()
WHERE id IN (
  '67845605-5a97-498c-b0e7-433d15b3954b','aafac768-c2c7-4edf-a861-9fcf64320cdb',
  '1ec06d83-ca48-481b-a61c-815cebf0e9e0','55f431bb-e451-49ee-af4a-f6e6c8f4dd42',
  'f6090ac5-3721-49b7-a7e4-ca0aa7fcbfd3'
);