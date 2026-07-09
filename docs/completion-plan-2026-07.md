# A*AI — Completion Plan (July 2026)

**Purpose:** sequence *everything remaining* — deploy the reviewed Lovable-exit/security
branch, then work the audit backlog (`docs/full-audit-2026-07.md`) to done — as a series
of self-contained **loops**. Each loop ends in something deployed, verified, and reversible.

**Working model (why it's loops, not one autonomous run):** no staging, `main` is prod,
edge functions deploy only via the Supabase CLI, and every Sacred/billing/migration change
needs James's explicit sign-off. So each loop is a collaboration: **I build → James signs
off / deploys / browser-tests → I verify → mark done → update memory → next loop.** Much of
this *cannot* be hands-off.

**Loop shape (every loop follows this):**
1. I do the code (subagents fan out on mechanical work; I keep design/reasoning).
2. Sign-off gate — I present diffs for anything Sacred/billing/migration; James nods.
3. Deploy — James runs the CLI / SQL-editor / Vercel steps (see per-loop "You do").
4. Verify — I check what I can headlessly; James runs the browser/Stripe tests I can't.
5. Close — mark done, note residual risk, update the `lovable-exit-and-audit` memory.

Legend: **[auto]** I can do on a nod · **[sign-off]** needs your explicit yes on a diff ·
**[YOU]** a manual step only you can do.

---

## ONE-TIME SETUP (blocks every deploy — do first)

- **[YOU] S1 — Install + link the Supabase CLI.** It's not on your PATH.
  `brew install supabase/tap/supabase` → `supabase login` → `supabase link --project-ref xoipyycgycmpflfnrlty`.
  (Region eu-west-2 / London.) Without this, no edge function can be deployed.
- **[YOU] S2 — Confirm DB settings for cron.** In the SQL editor:
  `SHOW app.settings.service_role_key;` and `SHOW app.settings.supabase_url;`.
  If unset, run the two `ALTER DATABASE` lines in `20260708130000_cron_auth_fix.sql`'s
  header, then reconnect. Prereq for Loop 0's cron fix.
- **[YOU] S3 — Take a DB backup / note the restore point** before the first `db push`
  (prod, no staging). Supabase dashboard → Database → Backups.

---

## LOOP 0 — Ship the reviewed branch (Lovable exit + security P0)  ← DO THIS FIRST

Everything already committed (9 commits) goes live. This is the gate: the new
`_shared/{ai,auth,rateLimit,http}.ts` infra must be live before any later backend loop.

- **[YOU] 0.1 — Push the branch** (`git push -u origin chore/lovable-exit-and-audit`) so it's
  backed up on the remote before touching prod. *(Does NOT deploy anything — edge fns/migrations
  don't auto-deploy; only a later merge to `main` moves the Vercel frontend.)*
- **[sign-off] 0.2 — Re-confirm the two migrations** (`ai_infra`, `cron_auth_fix`) — already
  approved per memory; I'll re-show the final text before you push.
- **[YOU] 0.3 — `supabase db push`** both migrations (or paste each into the SQL editor).
- **[YOU] 0.4 — Cron reschedule.** Run `SELECT jobname, schedule, command FROM cron.job;`
  Reschedule any job whose command sends the **anon** bearer onto `service_role_key` —
  the 5 dashboard crons (churn-detection, metrics-snapshot, conversion-nudges,
  exam-season-scheduler, escalate-bad-responses) that couldn't be verified statically,
  plus the `send-feedback-emails` fix the migration handles. I'll give you the exact
  reschedule SQL once we see the `cron.job` output.
- **[YOU] 0.5 — Deploy `suggest-followups` first:** `supabase functions deploy suggest-followups`.
  I then smoke-test Gemini-direct + rate limiting from the logs / a probe.
- **[YOU] 0.6 — Roll the rest:** `supabase functions deploy` (all) once 0.5 is clean.
- **[YOU] 0.7 — Browser live-tests I can't do headless:**
  (a) `rag-chat` with an **image** upload (streaming vision via Gemini OpenAI-compat — top risk);
  (b) logged-**out** on a `/free` page (the anon funnel you chose to keep).
- **[YOU] 0.8 — Deploy the frontend:** merge branch → `main` (Vercel auto-deploys ~60–90s).
  Must be AFTER 0.6 — `AdminContentHooksPage` needs the new `generate-content-script` fn to exist.
- **[auto] 0.9 — Grep-confirm zero Lovable refs** in the deployed tree.
- **[YOU] 0.10 — Rotate `LOVABLE_API_KEY`** once 0.9 is clean.
- **[auto/YOU] 0.11 — `git rm --cached .env` + gitignore it** (Phase 0 item 5; still tracked).
  Trivial, folds in here. *(Only public `VITE_` vars today, so no active leak — just close the trap.)*

**Exit:** all functions Gemini/OpenAI/Claude-direct, security P0 ring closed, anon funnel + image
RAG verified live, Lovable key rotated. **Rollback:** revert the frontend merge (Vercel redeploys);
re-deploy prior function versions from the CLI; migrations are additive (no destructive down needed).

---

## LOOP 1 — RAG vector fix + front-end perf  (audit Phase 1 — biggest user-visible win)

Unblocked the moment Loop 0 is live (embeddings now written direct). Two independent tracks.

- **[sign-off] 1.1 — New migration:** add a `content_type` filter arg to the `match_documents`
  RPC. Additive, but touches a function definition → sign-off + backup.
- **[auto] 1.2 — Wire `rag-chat` + `suggest-followups` to `match_documents`** (hybrid
  vector+keyword) and add `.limit()`. Kills the full-table scan (lag) *and* the "ignores the
  spec" quality complaint. Embed the query via the OpenAI-direct path already in `ai.ts`.
  *(MODELS.main diagram-matcher bug is already fixed — confirmed in code.)*
- **[auto] 1.3 — Front-end:** route-level `React.lazy` + `manualChunks` in `vite.config.ts`;
  move `checkProductAccess` behind React Query (installed, unused); stop re-checking access on
  every route (`Header.tsx`, `DashboardPage`, `AuthContext` mount). *(Touches `AuthContext.tsx`
  = Sacred → that slice is [sign-off]; the rest is [auto].)*
- **[YOU] 1.4 — Deploy** the two edge fns + push the migration; merge frontend to `main`.
- **[YOU] 1.5 — Verify:** ask the tutor a paraphrased spec question (semantic hit, not keyword);
  confirm dashboard load feels faster / fewer network calls.

**Exit:** retrieval is semantic + bounded; dashboard stops firing ~25 queries/load.

---

## LOOP 2 — RLS + storage isolation + hygiene  (audit Phase 0 leftovers)

The paywall/isolation gaps the Loop-0 auth guards didn't cover. All migration-based → Sacred RLS.

- **[sign-off] 2.1 — `document_chunks` RLS** is `USING(true)` → any free account reads paid
  subjects' content (paywall bypass). New migration to scope it.
- **[sign-off] 2.2 — Storage RLS** (`school-materials` / `school-branding`) gates only on
  `bucket_id` → any student reads every school's private materials. New migration.
- **[sign-off] 2.3 — `change_log` still `USING(true)`** (the admin-RLS fix migration missed it).
- **[YOU] 2.4 — Confirm the live `users` SELECT policy** expression is `auth.uid()`-scoped
  (named `select_own_user`; looked right in a screenshot, confirm the actual `USING`).
- **[YOU] 2.5 — `db push` the new migrations** (backup first).
- **[YOU/auto] 2.6 — Verify:** free account cannot read a paid subject's chunks; student can't
  list another school's storage objects.

**Exit:** paywall + school-material isolation enforced at the RLS layer.

---

## LOOP 3 — Billing correctness  (audit Phase 2 — ALL Sacred, plan + sign-off EACH)

Revenue/access leaks. `stripe-webhook`, `create-checkout`, `productAccess.ts` are Sacred —
one change at a time, diff + nod before each.

- **[sign-off] 3.1 — `past_due` keeps full access** through dunning → revoke on `past_due`.
- **[sign-off] 3.2 — No refund/dispute handling** → add `charge.refunded` / dispute webhook
  cases that revoke. **[YOU] add those events in the Stripe dashboard webhook config.**
- **[sign-off] 3.3 — Webhook idempotency race + non-idempotent affiliate insert** → dedup on
  `stripe_session_id` (prevents double commission payouts).
- **[sign-off] 3.4 — B2B school-checkout provisions nothing** → write seats/licence rows on the
  `school_license` branch; sync on cancel. *(Coordinates with the B2B schools build.)*
- **[sign-off] 3.5 — Duplicate active `user_subscriptions` rows REVOKE a paying user**
  (`productAccess.ts .maybeSingle()` nulls out) → handle >1 active row. Sacred + needs a data
  cleanup pass. Pairs with Build-portal WS-3 dedupe.
- **[YOU] 3.6 — Test each in Stripe test mode** (failing card, refund, duplicate-session) — I
  can't drive Stripe checkout headlessly.

**Exit:** entitlement can't leak on failed/refunded payments; no double payouts; B2B provisions.

---

## LOOP 4 — Correctness cleanup  (audit Phase 3)

Mostly `[auto]`; one Sacred slice.

- **[auto] 4.1 — ChallengePopup overwrites real grades** with hardcoded A-Level defaults (P1 data
  corruption; violates the no-hardcoded-A-Level rule). Read from `qualification.ts`.
- **[auto] 4.2 — Referral abuse cluster:** stop existing users self-serving premium
  (`useReferralCapture`); auth-guard `process-referral`'s `referred_user_id`; fix single-use/rotation.
- **[auto] 4.3 — Email idempotency:** `weekly-progress-email` "sent this week" ledger;
  paginate `send-feedback-emails` `listUsers()` (currently only first 50 users).
- **[sign-off] 4.4 — `signOut` clears no localStorage** → cross-user bleed on shared devices
  (Children's-Code-adjacent). Touches `AuthContext.tsx` = Sacred.
- **[YOU] 4.5 — Deploy + spot-check** on a shared-device account switch.

**Exit:** no grade corruption, no referral self-serve, emails idempotent + complete, clean sign-out.

---

## LOOP 5 — RAG quality depth  (audit Phase 4 — dovetails Build WS-6)

Builds on Loop 1's vector wiring.

- **[auto] 5.1 — Unified chunk metadata** across all ingest paths (`content_type`, `topic`,
  `spec_id`, `section`, `year`) so ranking + recency bonus work everywhere.
- **[sign-off] 5.2 — Model routing for marking:** consistent stronger model (Claude Sonnet /
  Gemini Pro) on the accuracy-critical marking path + a real rubric eval (not just latency/cost).
- **[auto] 5.3 — Semantic chunking + idempotent delete-then-insert ingest** (kills duplicate
  double-weighted chunks).

**Exit:** consistent metadata, consistent marking model, idempotent corpus.

---

## LOOP 6 — Build-portal remediation  (audit Phase 5 — WS-1…WS-11)

Per `docs/build-portal-remediation-plan.md`, unchanged. WS-3 (trainer_projects dedupe) also
clears the latent P2 where a legit trainer on a duplicate account 403s. Scoped as its own
multi-loop track when we get here.

---

## ALL MANUAL STEPS, CONSOLIDATED (what only James can do)

**Setup (once):**
- S1 install + `login` + `link` the Supabase CLI.
- S2 confirm `app.settings.service_role_key` / `supabase_url` DB settings.
- S3 DB backup / restore point before first `db push`.

**Recurring, every loop:**
- Sign off on each Sacred/billing/migration diff I present (one at a time).
- `supabase db push` (or paste SQL in the dashboard editor) for migrations.
- `supabase functions deploy <fn>` — deploy-one-first, then the rest.
- Merge branch → `main` for the Vercel frontend (always AFTER the edge fns exist).
- Run the browser / Stripe-test-mode flows I can't drive headlessly.

**Loop 0 specifics:**
- Push the branch; run the `cron.job` audit + reschedule SQL; image-RAG + logged-out /free
  browser tests; rotate `LOVABLE_API_KEY` after grep-clean.

**Later-loop specifics:**
- Loop 2/2.4: eyeball the live `users` SELECT policy expression.
- Loop 3/3.2: add `charge.refunded` + dispute events in the Stripe webhook config.
- Loop 3/3.6: Stripe test-mode flows (failing card, refund, duplicate session).

---

## Sequencing rule

Loop 0 gates everything. After that: 1 (top user win) → 2 (paywall/RLS) → 3 (revenue) →
4 (correctness) → 5 (RAG depth) → 6 (Build portal). Loops 1 and 2 are independent and could
interleave; 3 is the most sign-off-heavy and should not be rushed.
