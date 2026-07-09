# Loops 3–5 — Handoff (staged while you were away, 2026-07-09)

**Nothing in here is live yet.** Every fix is committed on `chore/lovable-exit-and-audit`,
build-verified, but **not deployed / not merged / no migration applied** — because billing
can't be verified without your Stripe test-mode pass, and the harness (correctly) blocks me
from applying prod migrations or deploying unverified billing code without your sign-off.

Do these in order. Take a DB backup before the migration (prod, no staging).

---

## 1. Apply the one migration (billing 3.3)

`supabase/migrations/20260709130000_affiliate_referrals_session_unique.sql` — unique index on
`affiliate_referrals(stripe_session_id)`. Verified 0 existing duplicates before writing it.

Apply via psql (session pooler) or SQL editor:
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_affiliate_referral_session
  ON public.affiliate_referrals (stripe_session_id);
```

## 2. Deploy the edge functions
```
supabase functions deploy check-subscription     # 3.1
supabase functions deploy stripe-webhook          # 3.2 + 3.3
supabase functions deploy create-checkout         # P2-1
supabase functions deploy conversion-nudges       # cron 500 fix (usage_date)
```
(Deploy-one-first if you like; these are independent.)

`conversion-nudges` is NOT billing — it's a broken daily cron found in the pg_net logs
(it 500'd every run: queried `daily_prompt_usage.date`, real column is `usage_date`).
Safe to deploy immediately, no Stripe involvement.

## 3. Add the two Stripe webhook events (required for 3.2 to do anything)
Stripe Dashboard → Developers → Webhooks → your endpoint → add events:
- `charge.refunded`
- `charge.dispute.created`

The new handlers are **inert until these are enabled** — that's why deploying stripe-webhook
in step 2 is safe with no behaviour change.

## 4. Merge frontend → main (Vercel)
`git checkout main && git merge --ff-only chore/lovable-exit-and-audit && git push origin main`
Ships: productAccess 3.5, ChallengePopup 4.1, useReferralCapture 4.2, AuthContext 4.4
(+ everything already merged).

## 5. Verify in Stripe TEST mode (the part I can't do)
- **3.1 past_due:** subscriber with a card that fails at renewal → after the 7-day grace,
  access is gone (previously kept full access through the whole dunning window).
- **3.2 refund:** refund a pass in the dashboard → `charge.refunded` fires → user loses
  access; `affiliate_referrals.status` for that session flips to `reversed`.
- **3.2 dispute:** simulate a dispute (test card `4000000000000259`) → access revoked.
- **3.3 dedup:** resend a `checkout.session.completed` from the Stripe dashboard → no second
  `affiliate_referrals` row for that session.
- **3.5 dup rows:** (data check) a user with >1 active row for a product now keeps access
  instead of being denied.
- **P2-1 price:** a product with a null `monthly_price`/`lifetime_price` → checkout returns
  `price_missing` instead of charging 899/1699.

---

## What's DONE (committed, staged)

| Item | Fix | Files | Sacred? |
|---|---|---|---|
| 3.1 | past_due no longer heals to active/extends unpaid period | check-subscription | yes |
| 3.2 | charge.refunded + charge.dispute.created revoke access + reverse commission | stripe-webhook | yes |
| 3.3 | affiliate insert→upsert on-conflict + unique index | stripe-webhook, migration | yes |
| 3.5 | >1 active sub row no longer denies a paying user | productAccess.ts | yes |
| P2-1 | require DB price, fail `price_missing`, no `||` fallback | create-checkout | yes |
| 4.1 | ChallengePopup preserves real grades (qualification.ts defaults) | ChallengePopup | no |
| 4.2 | referral only redeems for new accounts (client gate) | useReferralCapture | no |
| 4.4 | clear cross-user localStorage on sign-out | AuthContext.tsx | yes |

Already done earlier / verified in code: `send-feedback-emails` pagination (pages all users);
`MODELS.main` diagram-matcher (fixed); admin-cancel-stripe-sub auth (requireAdmin, Loop 0).

---

## What I deliberately did NOT do (and why)

- **3.4 — B2B school-checkout provisioning.** CLAUDE.md: don't build B2B infra speculatively;
  it's your deferred scope. Also depends on the un-applied `b2b_schools_layer` migration.
  Leaving the webhook `school_license` branch as-is.
- **4.3 — weekly-progress-email "sent this week" ledger.** Needs a new table/migration + can't
  be tested headless. A double weekly email is annoying, not access/revenue-critical. Staged
  as a follow-up: add a `weekly_email_sent(user_id, week_start)` ledger and skip if present.
- **4.2 deeper — process-referral server-side auth.** It's `verify_jwt=false` and trusts
  body `referred_user_id`. Proper fix = authenticate the caller and derive the id from the JWT,
  grant on one product not all, guard the unique index. Security-sensitive + untestable here →
  flagged. The client-side new-account gate is a mitigation, not the full fix.
- **Loop 2.2 — storage isolation** (school-materials/school-branding). Blocked on the deferred
  `b2b_schools_layer` migration being applied first.
- **Loop 5 — RAG quality (all).** Judgment + eval required, can't verify headless:
  - **5.2 model routing for marking** is a quality/cost decision for you: chat essay marking
    runs on Gemini Flash, `mock-exam-mark` on Pro. Recommend routing the accuracy-critical
    marking path to a consistent stronger model (Claude Sonnet or Gemini Pro) — but pick with a
    real rubric eval, not latency/cost (`model-comparison.mjs` only measures the latter).
  - **5.1 unified chunk metadata** (content_type/topic/spec_id/section/year across every ingest
    path) and **5.3 idempotent delete-then-insert ingest** rewrite corpus behaviour across
    several ingest functions; wrong = deleted/duplicated chunks. Needs an ingest test corpus.
- **Loop 6 — Build-portal (WS-1…11).** Separate tracked plan; not part of this audit sweep.

---

## Prod health findings (read-only, 2026-07-09)
- **Crons:** all 9 fire. No 401/403 auth failures in the pg_net window (the Loop-0 worry
  didn't materialise in what's retained). Two real issues found: `conversion-nudges` 500
  (fixed above) and a `daily-digest` 5s pg_net timeout — the function likely still completes
  server-side (cron fire-and-forget); worth confirming its runtime/logs but not a confirmed
  failure. pg_net prunes responses fast, so this is a partial window.
- **3.5:** 0 users currently hold >1 active sub row per product → the fix is a latent guard,
  not an active outage.
- **3.1:** 12 active monthly subs have a past local `subscription_end`. After deploy, the
  genuinely-lapsed ones stop being healed into unpaid access (7-day grace still applies) —
  a deliberate, correct change with real subjects, so deploy consciously.
- **2.1 (already live):** confirmed shielding ~8,500 paid past_paper/mark_scheme chunks from
  client reads while 5,937 `specification` chunks stay open; 0 untyped chunks caught. Working
  as intended.

## Residual risk to keep in mind
- The billing fixes are **logic/type/deploy-verified only** — NOT Stripe-e2e-verified. Run
  step 5 before trusting them in prod.
- `stripe-webhook` is Sacred and this is a substantial change; the new cases are additive but
  read the diff before deploying.
- Everything is reversible: revert the frontend merge (Vercel redeploys), redeploy prior
  function versions, drop the unique index. No destructive migration.
