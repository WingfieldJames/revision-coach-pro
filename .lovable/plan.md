I found several concrete checkout risks that can explain today’s missed Deluxe grants and could cause repeat incidents.

Key findings:
- `create-checkout` is using the anon client to read `products`, but the database currently does not grant SELECT privileges on `public.products` to `anon` or `authenticated`. The function logs show `permission denied for table products`, so Stripe sessions can be created without product data even when the UI passed a product ID.
- All `products.stripe_monthly_price_id` and `stripe_lifetime_price_id` values are NULL, while checkout creates inline `price_data`. That means the webhook’s new “infer product from Stripe price id” fallback cannot work for these purchases, because there are no reusable product price IDs to match against.
- The webhook still acknowledges every processing failure with HTTP 200. This prevents Stripe retries even when the database write fails.
- There is no durable webhook event ledger / idempotency table. Current duplicate prevention checks for an existing active subscription, but it is not atomic and does not record failed events for recovery.
- `verify-payment` is unsafe and incomplete: it only updates the legacy `users` table, does not insert into `user_subscriptions`, does not validate the authenticated user owns the Stripe session, and can mask webhook failure.
- `check-subscription` updates the legacy `users` table based on “any premium product”, which can overwrite legacy fields even when the user is checking a different product. Product-specific access is still mostly handled through `user_subscriptions`, but the legacy sync can confuse UI state.
- Some premium pages directly query `products` and `user_subscriptions` rather than using the shared `checkProductAccess` logic, which can miss expiry/grace/bundle behavior.
- There are existing duplicate active subscriptions for a few users; this is not the main failure but shows idempotency is not strict enough.
- The recent live example in logs (`raiyanahmed7002@gmail.com`) created a Stripe checkout session after the product lookup failed. In the database they currently have no `user_subscriptions` row, so this user should be included in the next recovery audit.

Plan to fix this properly:

1. Immediate database permission fix
   - Add a migration granting SELECT on `public.products` to `anon` and `authenticated`.
   - Keep RLS policy limiting public reads to `active = true`.
   - This fixes frontend product loading and the product lookup inside checkout when using the anon-auth client.

2. Make `create-checkout` fail closed instead of creating bad sessions
   - Switch product lookup to the service-role client inside the Edge Function, so checkout does not depend on frontend table grants.
   - Validate `paymentType` is only `monthly` or `lifetime`.
   - Require a valid product from `productId` or `productSlug`; only use `edexcel-economics` fallback for truly legacy requests with no product passed.
   - If a product ID is passed but cannot be resolved, return a 400 and do not create a Stripe session.
   - Put redundant metadata on the Stripe session: `user_id`, `user_email`, `product_id`, `product_slug`, `payment_type`, and affiliate fields.
   - Change success/cancel URLs to preserve qualification route where possible (`/compare` vs `/gcse`/dynamic product), so users land in the right place.

3. Harden `stripe-webhook` so paid sessions always become access rows
   - Stop returning 200 on critical processing errors; return 500 so Stripe retries when subscription creation fails.
   - On `checkout.session.completed`, retrieve full session details and line items if needed.
   - Resolve user in this order: metadata `user_id`, then `users.email`, then auth/admin lookup by email if available.
   - Resolve product in this order: metadata `product_id`, metadata `product_slug`, price-id mapping if available, then safe legacy fallback only for old generic sessions.
   - For monthly subscriptions, retrieve the live Stripe subscription and use `current_period_end` instead of “now + one month”.
   - Upsert into `user_subscriptions` by `(user_id, product_id)` rather than insert-only, updating Stripe IDs and end date when an existing row exists.
   - Keep the legacy `users` table in sync after the product subscription write succeeds.

4. Add proper idempotency and recovery observability
   - Create a `stripe_webhook_events` table with `event_id` UNIQUE, `event_type`, `stripe_object_id`, `status`, `error_message`, `processed_at`, and resolved `user_id/product_id`.
   - Record every webhook event as `processing`, `processed`, or `failed`.
   - Duplicate Stripe retries should return safely only after checking the stored event status.
   - Add indexes on `user_subscriptions` for Stripe subscription/customer lookups and a partial unique index to prevent multiple active rows for the same `(user_id, product_id)` going forward.

5. Replace/repair `verify-payment`
   - Do not let `verify-payment` grant access by email alone.
   - Either remove its granting behavior and make it return session status only, or make it call the same secure grant/upsert path as the webhook after verifying the logged-in user owns the session.
   - Update success redirect pages to call `check-subscription`/product access after returning from Stripe, not rely on legacy-only updates.

6. Frontend checkout consistency
   - Ensure every `create-checkout` call sends either `productId` or `productSlug` reliably.
   - Add `productSlug` alongside `productId` from Compare, GCSE, chatbot toolbar, sidebar, RAG chat upgrade, Essay Marker, Diagram Finder, Header, and Dashboard flows.
   - Improve user-facing errors so “checkout could not identify the subject” is shown instead of a vague failure.

7. Product access consistency
   - Refactor premium page guards that directly query subscriptions to use `checkProductAccess` so grace periods, product bundles, and expiry rules are consistent.
   - Keep `useProductTier` for chat tier decisions, but consider routing it through the same shared access helper.

8. Recovery audit after deploy
   - Run a live audit of today’s Stripe checkout sessions and invoices against `users` and `user_subscriptions`.
   - Grant missing Deluxe access for every paid session that has no active subscription row, including the new logged example `raiyanahmed7002@gmail.com` if Stripe confirms payment.
   - Produce a concise report: paid sessions checked, already granted, newly recovered, skipped/unpaid, and any unresolved email/user mismatches.

Technical implementation notes:
- Database changes need a migration for product grants, webhook event ledger, indexes, and active-subscription uniqueness.
- Edge functions to modify: `create-checkout`, `stripe-webhook`, and `verify-payment`.
- Frontend files to touch include checkout callers and premium access guards.
- After implementation, deploy the modified Edge Functions and run targeted checks against `create-checkout`, `stripe-webhook` logs, and database subscription rows.