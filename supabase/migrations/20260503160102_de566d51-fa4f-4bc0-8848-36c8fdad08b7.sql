-- 1) Grant SELECT on public.products to anon and authenticated.
-- RLS still restricts visible rows to active = true (existing policy), but the
-- table-level grant was missing, causing "permission denied" in checkout.
GRANT SELECT ON public.products TO anon, authenticated;

-- 2) Webhook event ledger for idempotency + observability.
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  stripe_object_id text,
  status text NOT NULL DEFAULT 'processing' CHECK (status IN ('processing','processed','failed','skipped')),
  user_id uuid,
  product_id uuid,
  error_message text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view stripe webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Admins can view stripe webhook events"
ON public.stripe_webhook_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_event_type
  ON public.stripe_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status
  ON public.stripe_webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_object
  ON public.stripe_webhook_events(stripe_object_id);

-- 3) Prevent duplicate active subscriptions for the same user/product.
-- Clean up any existing duplicates first by keeping the most recently created one active.
WITH ranked AS (
  SELECT id,
         row_number() OVER (
           PARTITION BY user_id, product_id
           ORDER BY created_at DESC, started_at DESC NULLS LAST
         ) AS rn
  FROM public.user_subscriptions
  WHERE active = true
)
UPDATE public.user_subscriptions us
SET active = false,
    updated_at = now()
FROM ranked
WHERE us.id = ranked.id
  AND ranked.rn > 1;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_active_user_product_subscription
  ON public.user_subscriptions(user_id, product_id)
  WHERE active = true;

-- 4) Helpful indexes for webhook + cancel flows.
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_subscription_id
  ON public.user_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_stripe_customer_id
  ON public.user_subscriptions(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;
