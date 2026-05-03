## Diagnosis

Dylan's account (`dylanirving040@gmail.com`, user id `dd30bab6-eb69-4c20-9e0d-42c7c18e587a`) is set up but his purchase didn't grant access:

- `users` row: `is_premium = false`, `subscription_tier = null`, but he does have a Stripe customer id `cus_URtp3ZUURfY434` — meaning a Stripe checkout did happen.
- `user_subscriptions`: **0 rows** for his user id. This is why the app shows him as free.
- The Stripe webhook never wrote his subscription. Either the `checkout.session.completed` event fired without the `user_id` in metadata, or it failed silently. (No matching webhook logs for his customer id are retrievable.)

So the immediate fix is to manually grant his Edexcel Economics Deluxe access, then patch the webhook gap so it can't recur.

## Plan

### 1. Restore Dylan's access (migration)

Insert a row into `user_subscriptions` for his user, against the Edexcel Economics product:

- Look up Stripe to confirm which product he paid for and whether it was monthly or lifetime, plus the `subscription_end` (if monthly) and the `stripe_subscription_id`.
- Insert `user_subscriptions` row with: `user_id`, `product_id` (Edexcel Economics A-Level), `tier = 'deluxe'`, `payment_type` (monthly/lifetime), `active = true`, `stripe_customer_id = cus_URtp3ZUURfY434`, `stripe_subscription_id` (if monthly), `subscription_end` (period end if monthly, null if lifetime), `started_at = now()`.
- Also update `users` row: `is_premium = true`, `subscription_tier = 'Deluxe'`, `subscription_end` to match (for legacy compatibility).

### 2. Harden the webhook against this class of failure

In `supabase/functions/stripe-webhook/index.ts`, on `checkout.session.completed`:

- If `session.metadata.user_id` is missing, fall back to looking up the user by `customer_email` (or by `stripe_customer_id` already saved on `users`) before bailing out — currently it likely silently no-ops.
- Always log the full session payload (event id, customer, metadata) on entry and on every early-return path so we can audit failed grants from logs.
- Wrap the subscription upsert in a try/catch that re-raises so Stripe will retry the webhook instead of returning 200 on a partial failure.

### 3. Add a self-healing reconciliation path

Extend `check-subscription` (already does Stripe-based healing for monthly subs) so that if a user has a `stripe_customer_id` but **no `user_subscriptions` rows**, it queries Stripe for that customer's active subscriptions / completed one-time payments and back-fills `user_subscriptions`. This means future webhook misses self-correct the next time the user opens the app.

### 4. Notify Dylan

Suggested reply once access is restored:

> Hi Dylan — sorry about that. I've checked your account: the payment came through on our side but a sync step failed so your Deluxe access wasn't switched on. I've manually applied your Edexcel Economics Deluxe subscription now and patched the underlying issue so it can't happen again. You should be able to use everything straight away — log out and back in if it doesn't appear immediately.

## Technical details

- Tables touched: `user_subscriptions` (insert), `users` (update for legacy `is_premium`).
- Edge functions touched: `stripe-webhook` (resilience + logging), `check-subscription` (Stripe reconciliation fallback).
- No schema changes required.
- Need to query Stripe (via STRIPE_SECRET_KEY) for `cus_URtp3ZUURfY434` to determine exact product purchased, payment type, and period end before inserting the row — avoids guessing.  
  
  
Give dylan Edexcel politics deluxe too please. Manually make sure he has both edexcel politics and edexcel economics deluxe 