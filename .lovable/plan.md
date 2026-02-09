

# Fix: Grant Sean Han CIE Economics Access + Webhook Bug Fix

## Diagnosis

**Sean Han's account status:**
- Email: `seanhan2023@gmail.com`
- User ID: `afbca939-39d4-48f2-86dd-9f95561360da`
- `is_premium`: false
- No entry in `user_subscriptions` table at all
- No Stripe customer/subscription IDs recorded

**CIE Economics product:**
- Product ID: `9a710cf9-0523-4c1f-82c6-0e02b19087e5`
- Slug: `cie-economics`

**Root cause:** There are zero `stripe-webhook` invocations in the edge function logs. This means Stripe's webhook call never successfully reached (or was never sent to) the edge function. The most likely causes are:

1. **Webhook signature verification uses synchronous `constructEvent()`** (line 52 of `stripe-webhook/index.ts`) instead of `constructEventAsync()`. In Deno, the synchronous version can fail silently because it relies on Node.js crypto primitives that aren't available. This is a known issue.
2. **Stripe Dashboard webhook configuration** may have the wrong endpoint URL or missing event types. This needs to be verified by the user in their Stripe Dashboard.

---

## Step 1: Grant Sean Han Manual Access (Database Migration)

Insert a subscription record for Sean Han into `user_subscriptions` and update the legacy `users` table:

**user_subscriptions insert:**
- `user_id`: `afbca939-39d4-48f2-86dd-9f95561360da`
- `product_id`: `9a710cf9-0523-4c1f-82c6-0e02b19087e5` (CIE Economics)
- `tier`: `deluxe`
- `payment_type`: `monthly`
- `subscription_end`: 1 month from now (March 9, 2026)
- `active`: true

**users table update:**
- Set `is_premium = true`, `subscription_tier = 'Deluxe'`, `payment_type = 'monthly'`, `subscription_end` to March 9, 2026

This immediately gives Sean Han access to CIE Economics Deluxe.

---

## Step 2: Fix Webhook Signature Verification

Change line 52 in `supabase/functions/stripe-webhook/index.ts` from:

```
event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
```

to:

```
event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
```

This is the async version that works correctly in Deno's runtime. The synchronous version relies on Node.js `crypto` module which may not be available or may fail silently in the Deno/Supabase Edge Functions environment.

---

## Step 3: Redeploy Webhook

After fixing the code, redeploy the `stripe-webhook` edge function so future payments are processed correctly.

---

## Manual Verification Required (by you, the project owner)

After implementation, please verify in the **Stripe Dashboard** (Developers > Webhooks):

1. The webhook endpoint URL is set to: `https://xoipyycgycmpflfnrlty.supabase.co/functions/v1/stripe-webhook`
2. The following events are enabled:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
3. The webhook signing secret matches the `STRIPE_WEBHOOK_SECRET` stored in your Supabase secrets

---

## Files Changed

| File | Change |
|------|--------|
| New migration SQL | INSERT into `user_subscriptions` + UPDATE `users` for Sean Han |
| `supabase/functions/stripe-webhook/index.ts` | Line 52: `constructEvent` -> `await constructEventAsync` |

