# Billing / Payments Subsystem Audit — A* AI

**Scope:** Stripe checkout, webhook, cancellation, subscription sync, grace period, B2B school checkout, referral grants, and client callers.
**Method:** Read-only static analysis. No files changed.
**Owner symptom:** "stripe cancellations and general payment buggy" — trouble cancelling, state out of sync, flaky payments.

Severity key: **P0** = revenue/access critical or security hole · **P1** = serious · **P2** = minor.

---

## P0 findings

### P0-1. `admin-cancel-stripe-sub` is a public, unauthenticated endpoint that cancels any subscription
**Files:** `supabase/functions/admin-cancel-stripe-sub/index.ts:10-39`; `supabase/config.toml:14-15` (`verify_jwt = false`).

The function has `verify_jwt = false` AND performs **no auth check, no admin role check, no ownership check**. It reads `{ subscriptionRowId, stripeSubId }` straight from the request body, calls `stripe.subscriptions.cancel(stripeSubId)`, and force-updates the `user_subscriptions` row to `active:false, subscription_end:now()` using the service-role key.

**Failure scenario:** Anyone on the internet who can reach the function URL and supply a Stripe subscription id (format `sub_...`) can immediately cancel that customer's subscription and revoke DB access. Stripe sub ids are not secrets (they appear in URLs, invoices, emails, logs). An attacker who also passes any `subscriptionRowId` flips a DB row inactive. This is an unauthenticated destructive endpoint — mass customer griefing / targeted access-denial. It also has no CORS `Access-Control-Allow-Origin` restriction. Not referenced by any client code (only `config.toml`), so it appears to be an internal/admin tool that was deployed without a gate.

**Fix:** Add auth: require a valid JWT and check `has_role(uid,'admin')` (as other admin functions do), OR gate behind a shared secret header validated server-side, OR remove/undeploy it if unused. At minimum set `verify_jwt = true` and verify caller is admin before any Stripe/DB mutation.

---

## P1 findings

### P1-2. `check-subscription` treats `past_due` as fully active and "heals" access for unpaid periods
**File:** `supabase/functions/check-subscription/index.ts:9, 76-120`.

`ACTIVE_STRIPE_STATUSES = {active, trialing, past_due}`. When a monthly sub looks expired locally, the function fetches the live Stripe sub; if status is in that set and `current_period_end > now`, it writes `active:true, cancelled_at:null, subscription_end = current_period_end`.

**Failure scenario:** A monthly subscriber's card fails at renewal. Stripe moves the subscription to `past_due` and (depending on dunning config) advances `current_period_end` to the new, **unpaid** period. `check-subscription` sees `past_due` + future `current_period_end`, marks the local row active and extends `subscription_end` to that unpaid period. The user retains full deluxe access for the entire dunning window without having paid. Because AuthContext calls `check-subscription` on load (`src/contexts/AuthContext.tsx:87`), this heals on every visit. Combined with P1-3 grace, a non-paying user can hold access for weeks.

**Fix:** Do not treat `past_due` as access-granting. Restrict healing to `active`/`trialing`. Handle `past_due` via `invoice.payment_failed` dunning policy (below), not by extending access.

### P1-3. No refund / dispute / chargeback handling — refunded lifetime passes keep access forever
**File:** `supabase/functions/stripe-webhook/index.ts:211-472` (switch handles only checkout, invoice paid/failed, sub updated/deleted). No `charge.refunded`, `charge.dispute.created`, or `refund.*` cases.

The Exam Season Pass is a one-off `mode:"payment"` purchase with `subscription_end` hardcoded to `2026-06-30` (webhook line 269) and **no Stripe subscription object**. `cancel-subscription` explicitly refuses non-monthly ("Lifetime purchases are permanent", `cancel-subscription/index.ts:105-108`).

**Failure scenario:** Admin issues a refund for a lifetime pass in the Stripe dashboard (or a customer files a chargeback). No webhook path revokes the `user_subscriptions` row or `users.is_premium`. The refunded/disputed customer keeps deluxe access until 2026-06-30. Direct revenue loss + fraud exposure. Same gap for monthly subs refunded mid-period.

**Fix:** Add `charge.refunded` and `charge.dispute.created` handlers that resolve the affected user/product (via `payment_intent`/`charge` → session/customer) and set the subscription inactive; reverse any `affiliate_referrals` commission for that session.

### P1-4. Webhook idempotency has a concurrency/failed-retry gap → double-processing and double affiliate commission
**File:** `supabase/functions/stripe-webhook/index.ts:22-53, 318-341`.

`recordEvent` inserts a ledger row with `status:'processing'`. On a duplicate delivery it catches the `23505` unique violation, but only returns `alreadyProcessed:true` when the existing status is exactly `'processed'`. For status `'processing'` or `'failed'` it returns `alreadyProcessed:false` and **reprocesses**.

Two concrete failure modes:
1. **Concurrent duplicate deliveries** (Stripe can send the same event twice, and it retries on timeout): both invocations see `'processing'` and both run the full handler.
2. **Retry after failure:** any post-upsert error marks the event `'failed'`; Stripe retries; the handler re-runs from the top.

The `affiliate_referrals` insert (lines 330-340) has **no dedup guard** on `stripe_session_id`. So any reprocess inserts a second commission row for the same sale → the affiliate is paid twice (or N times across retries). The subscription upsert itself is idempotent (guarded by `uniq_active_user_product_subscription`), so access isn't doubled, but commissions and the legacy `users` writes are re-run.

**Fix:** (a) Make the ledger the true gate: only reprocess when status is `'failed'` after an explicit retry budget, and treat `'processing'` as "in-flight, ack with 200" or use a transactional claim (`UPDATE ... WHERE status='processing' AND ...`). (b) Dedup `affiliate_referrals` on `stripe_session_id` (unique index + `on conflict do nothing`, or check-before-insert).

### P1-5. B2B school payment provisions nothing — webhook school branch is a no-op
**Files:** `stripe-webhook/index.ts:222-227`; `school-checkout/index.ts` (no DB writes at all).

`school-checkout` creates a Stripe subscription with `metadata.checkout_type = "school_license"` but writes nothing to Supabase. The webhook's school branch just marks the event processed with `error_message:"school_license handled"` and a comment "handled elsewhere historically" — it does **not** create a `school_licenses` row, seats, or activate anything. Grepping confirms `school_licenses` rows are only created by `school-invite` (line 188), not by the paid checkout.

**Failure scenario:** A school pays via `school-checkout`. Payment succeeds, Stripe subscription is live and billing, but no license/seat is provisioned automatically. Students get no access unless someone manually creates the license. Also, cancellation of that school Stripe sub has no local effect (no matching `stripe_subscription_id` row), so billing and access can drift independently. This is a B2C/B2B consistency gap and a revenue-vs-access mismatch.

**Fix:** Implement school-license provisioning in the webhook's `school_license` branch (create/activate `school_licenses` with seat count from `metadata.seats`, link `stripe_subscription_id`), and handle its cancellation/`subscription.deleted`. If provisioning is intentionally manual, remove the "handled" claim and alert instead.

---

## P2 findings

### P2-1. Hardcoded price fallbacks in `create-checkout` (CLAUDE.md violation) can charge the wrong amount
**File:** `create-checkout/index.ts:127, 150`.

`unit_amount: product.monthly_price || 899` and `unit_amount: product.lifetime_price || 1699`. CLAUDE.md explicitly forbids hardcoded prices. If a product row has a NULL/0 `monthly_price` or `lifetime_price`, the customer is silently charged £8.99 / £16.99 regardless of intended price. For the "re-priced often" Exam Season Pass this can bill a stale amount. `0` is falsy so a legitimately free/zero product also falls through to the hardcoded value.

**Fix:** Require the DB price; if missing, fail the checkout (`price_missing`) rather than defaulting. Do not use `||` with numeric prices (breaks on 0) — check `!= null`.

### P2-2. Hardcoded lifetime expiry and +30d fallback in webhook
**File:** `stripe-webhook/index.ts:268-269, 262-266`.

Lifetime/pass `subscription_end` is hardcoded to `"2026-06-30T23:59:59Z"`; the subscription-mode fallback (when the live sub read fails) hardcodes `+30 days`. If the pass is extended/renamed for a future season, paid users get the wrong expiry. The +30d fallback can grant a longer/shorter period than the real Stripe period on transient API errors.

**Fix:** Read the pass end date from product config/DB; for subscriptions, if the live-sub read fails, retry rather than guessing +30d (or leave null and reconcile via `invoice.paid`).

### P2-3. `invoice.payment_failed` does nothing — no dunning, no notification
**File:** `stripe-webhook/index.ts:464-467`.

The handler just marks the event processed. No email, no state change, no grace tracking. Combined with P1-2 (past_due heals to active) and P1-3 (grace), a failing card yields silent continued access with no user prompt to fix payment, and eventual silent loss when Stripe finally deletes the sub — matching the owner's "state out of sync" symptom.

**Fix:** On `invoice.payment_failed`, flag the sub as `past_due` locally and trigger a "update your card" email; decide an explicit access policy for the dunning window.

### P2-4. Paid-but-unresolvable checkout retries forever with no operator alert
**File:** `stripe-webhook/index.ts:243-251` (via `resolveProductId` returning null, lines 86-116).

If `checkout.session.completed` can't resolve `userId` or `productId`, it returns 500 so Stripe retries. Correct to not guess, but the customer has **paid and has no access** until someone manually inspects `stripe_webhook_events` where `status='failed'`. In normal flow `create-checkout` always sets `product_id` metadata, so this is an edge case (e.g. Payment Links, metadata drift), but there's no alerting.

**Fix:** On resolve failure, emit an alert (email/Slack) in addition to the failed ledger row so paid-no-access is caught quickly.

### P2-5. Post-payment access window: `verify-payment` deliberately grants nothing; access waits on the webhook
**Files:** `verify-payment/index.ts:16-17, 56-65`; `src/pages/DashboardPage.tsx:194-212`, `src/pages/ComparePage.tsx:281`, `src/pages/GCSEComparePage.tsx:59`; `AuthContext.tsx:87`.

`verify-payment` only reports Stripe session status; the subscription row is written solely by the webhook. The client calls `verify-payment` then `refreshProfile()` (→ `check-subscription`, which reads `user_subscriptions`). If the webhook hasn't landed yet, `check-subscription` finds no row and the just-paid user sees no access until they refresh again. This is a legitimate design (single source of truth = webhook) but produces a visible "I paid and nothing happened" window — a plausible contributor to "payments feel flaky".

**Fix:** Have the client poll `check-subscription`/`checkProductAccess` a few times with backoff after `payment_success`, and show a "activating your access…" state instead of a one-shot check.

### P2-6. `check-subscription` and `productAccess.ts` are two independent sources of truth that can disagree
**Files:** `check-subscription/index.ts` (global `is_premium`, heals + writes `users`); `src/lib/productAccess.ts:14-135` (per-product read of `user_subscriptions`, plus school + legacy paths).

`AuthContext` surfaces a global `is_premium` from `check-subscription`, while gating uses per-product `checkProductAccess`. Their grace/healing logic is duplicated but not identical (e.g. `check-subscription` heals from Stripe and treats `past_due` as active; `productAccess` does neither, only a 7-day monthly grace). A user can appear premium globally but be gated out of a specific product, or vice versa — "state out of sync" as the user perceives it.

**Fix:** Consolidate to one server-side entitlement source; have the client read per-product access from it rather than maintaining a parallel client-side copy.

### P2-7. `process-referral` grants 7 days across **every** product, unbounded, and can be replayed
**File:** `process-referral/index.ts:126-182`; `config.toml` (`verify_jwt = false`).

On a completed referral it loops **all** products and grants/extends deluxe on each — so a single referral unlocks the entire catalogue for 7 days for both users, not just one subject. The insert path has no guard against the `uniq_active_user_product_subscription` index (a concurrent grant would throw, unhandled `await`). It's also `verify_jwt=false` and takes `referred_user_id` from the body without verifying the caller is that user, so referral completion can be driven for arbitrary user ids (self-serve free premium by scripting referral codes). Status/self-referral checks exist but the auth gap remains.

**Fix:** Grant referral reward on a single/intended product, authenticate the caller and derive `referred_user_id` from the JWT, and guard inserts against the unique index.

### P2-8. Immediate-cancel path clears the legacy `users` Stripe fields for the whole user regardless of which sub
**File:** `cancel-subscription/index.ts:201-212`.

In the `cancelAtPeriodEnd=false` branch it wipes `users.stripe_subscription_id`, `payment_type`, `subscription_end`, `is_premium` for `user.id` even if the user holds other active products. For multi-product users this corrupts legacy fields. Low impact because clients always call with `cancelAtPeriodEnd=true`, but it's a latent data-integrity bug.

**Fix:** Scope legacy cleanup to the specific `stripe_subscription_id`, or drop the legacy write and rely on `customer.subscription.deleted`.

---

## Cross-cutting notes / verified-OK

- **Webhook signature verification:** correctly implemented with `constructEventAsync` and a mandatory `STRIPE_WEBHOOK_SECRET`; missing secret returns 500, bad signature returns 400 (`stripe-webhook/index.ts:179-194`). Good.
- **`cancel-subscription` verify_jwt=false is acceptable** — it does manual JWT auth via the anon client (`getUser(token)`) before acting (`cancel-subscription/index.ts:27-41`). Not a hole (unlike P0-1).
- **Happy-path cancel is correct:** sets `cancel_at_period_end` at Stripe, marks `cancelled_at` locally, keeps `active:true` until `customer.subscription.deleted` flips it (`cancel-subscription/index.ts:156-183`, webhook `430-462`). The webhook `customer.subscription.updated` also mirrors `cancel_at_period_end` (`405-428`).
- **Partial failure risk in cancel:** Stripe call and DB update are sequential and not transactional. If Stripe succeeds but the DB update (line 169-177) fails, the user is cancelled at Stripe but `cancelled_at` stays null locally — UI shows "active/not cancelled" though it will end. Reconciled later by `subscription.updated`/`deleted` webhooks, so self-heals, but explains transient "did my cancel work?" confusion. (P2-ish, mitigated by webhooks.)
- **Duplicate active subscriptions** are prevented by `uniq_active_user_product_subscription` (migration `20260503160102`), and `upsertSubscription` respects it. Good.
- **7-day grace (productAccess.ts:45-54)** is scoped to monthly + requires `subscription_end` and `active:true`; a properly deleted sub (`active:false`) is excluded, so it's not directly exploitable on its own — but it stacks with P1-2 healing to prolong non-paying access.

## Suggested remediation order
1. **P0-1** — lock down/undeploy `admin-cancel-stripe-sub` immediately.
2. **P1-2** — stop granting access on `past_due`.
3. **P1-3** — add refund/dispute revocation.
4. **P1-4** — fix idempotency race + dedup affiliate commissions.
5. **P1-5** — provision (or explicitly alert on) school payments.
6. P2 items as follow-up hardening.
