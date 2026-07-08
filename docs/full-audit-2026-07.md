# A* AI — Full Codebase Audit (July 2026)

**Status:** analysis only — no code changed. Read-only audit across five subsystems.
**Method:** five parallel deep audits (security, payments, performance/scale, RAG/training, correctness). Detailed per-area evidence lives in `docs/audit/*.md`; this file is the synthesis + prioritised action plan.
**Scope note:** the Build-portal bugs (B1–B16) are already catalogued in `build-portal-remediation-plan.md` and are **not** re-listed here — this audit covers the rest of the app.

---

## 0. Read this first — the one-paragraph verdict

The app works on the happy path but is carrying **three categories of serious risk that are live in production right now**:

1. **A ring of unauthenticated, RLS-bypassing edge functions.** ~38 functions run with `verify_jwt = false`; most of them do *no* auth of their own, spin up a **service-role** client, and act on request-body params. CORS is `*`. So they are callable from any browser with only your public anon key. This exposes minors' PII, lets anyone rewrite the AI prompt served to students, dump business metrics, cancel any subscription, and poison the RAG corpus. **These are exploitable today with no special access.**
2. **Your "RAG" isn't RAG.** The chatbot loads the *entire* chunk table for a subject into memory on every message and keyword-counts it in JavaScript. The pgvector embeddings you pay to generate on every ingest are **never queried**. This is simultaneously the biggest cause of the lag under load *and* the biggest cause of "the chatbot ignores the spec."
3. **Billing has real access/revenue leaks.** Failing-card customers keep full access through the whole dunning window; refunded lifetime buyers keep access; B2B school payments provision nothing; and duplicate subscription rows can *revoke* a paying customer's access.

None of the P0s require a rewrite. The security cluster in particular is mostly a **repeatable one-line auth-guard pattern** applied ~15 times. Do that first.

---

## 1. The 6 things that matter most (in order)

| # | Finding | Area | Why now |
|---|---------|------|---------|
| 1 | Unauthenticated service-role edge functions (system-prompt rewrite, PII dump, sub-cancel, corpus poison) | Security | Exploitable today; child-safety + GDPR exposure |
| 2 | Confirm the live `users` table SELECT policy in the Supabase dashboard | Security | If it's `USING(true)` it's a mass PII leak — code can't tell us |
| 3 | RAG = in-memory keyword scan of the whole corpus; vector index is dead code | Perf + Quality | Root cause of lag *and* poor answer quality |
| 4 | `past_due` keeps access + refunds don't revoke + B2B provisions nothing | Payments | Direct revenue leak; "payment buggy" symptom |
| 5 | No route code-splitting + React Query unused + access re-checked on every route | Perf | Front-end lag, ~25 queries per dashboard load |
| 6 | ChallengePopup overwrites students' real grades with hardcoded A-Level defaults | Correctness | Silent data corruption; poisons personalisation + RAG |

Everything below expands these and adds the second tier.

---

## 2. SECURITY — the P0 emergency (detail: `docs/audit/audit-security.md`)

**Root cause:** `verify_jwt = false` is set on ~38 functions in `supabase/config.toml`. That's correct for signed webhooks and public cron — but most of these functions never authenticate the caller, immediately create a **service-role** client (which bypasses RLS entirely), and trust body params like `user_id`. With `CORS: *`, any website can call them using the public anon key.

### P0 — exploitable now
- **`update-system-prompt`** (`index.ts:14-31`) — no auth. Anyone can rewrite the AI tutor's system prompt for any subject; it's then served to every student via `rag-chat`. **Mass stored prompt-injection against minors / child-safety bypass. Worst finding.**
- **`get-feedback`** (`index.ts:14-40`) — no auth; dumps every user's email (`auth.admin.listUsers()`) + feedback. **Minors' PII / GDPR breach.**
- **`get-analytics`** (`index.ts:18`, comment literally says `// hidden by obscurity`) — no auth; dumps full business metrics/MRR.
- **`admin-cancel-stripe-sub`** (`index.ts:13-31`) — no auth despite the name; cancel *any* customer's subscription by `sub_...` id. *(Stripe-adjacent → sign-off before editing.)*
- **`deploy-subject`** (`index.ts:70-122`) — no auth; re-price, unpublish, or wipe a subject's `document_chunks`. *(Billing-adjacent → sign-off.)*
- **RAG corpus poisoning** — `ingest-documents` / `ingest-content` / `ingest-*` / `process-training-file`: no auth; inject attacker chunks that `rag-chat` feeds to students.
- **`delete-training-upload`** — no auth; destructive IDOR by UUID (rows + chunks + storage object).
- **`school-accept-invite`** (`index.ts:20,31,50`) — JWT only checked `if (authHeader)`; POST with **no** header → trusts `body.user_id` → grant any account school "deluxe" + burn a school's seats. *Verified.*
- **`users` table SELECT policy is not in the repo** — **must be confirmed live in the dashboard.** If `USING(true)`, it's a P0 PII leak. Highest-priority unknown.

### P1
- **Storage RLS** (`20260707120000:441-450`) — `school-materials` / `school-branding` gate only on `bucket_id` → any student reads every school's private materials and can upload into the bucket; `school-branding` is `public=true`.
- **`document_chunks` `USING(true)`** (`20260115114606:25-29`) — any free authenticated account can read paid subjects' content. **Paywall bypass.**
- **`update-brain-profile`** — no auth; body-`user_id` IDOR + prompt injection into a student's stored profile.
- **Cron/email functions** (`churn-detection`, `weekly-progress-email`, `send-feedback-emails` incl. a `{test_email}` bypass, `conversion-nudges`, `analyze-feedback`) — no shared secret; anyone triggers mass email to minors + uncapped AI spend.
- **`school-invite`** — `Math.random()` codes (`:11-18`), no expiry, no email binding → guessable/replayable onboarding.
- **`erase-training-data`** — role-checked but no per-project ownership (a trainer can wipe another subject). **`backfill-training-data`** — no auth.
- **`rag-chat`** — best-effort auth → free unauthenticated use of the paid tutor + victim-`user_id` quota exhaustion.
- **No age-assurance / DOB / parental consent anywhere** — material ICO Children's Code gap for onboarding under-16s.

### P2 / hygiene
- `change_log` still `USING(true)` (the `20260416120000_fix_admin_table_rls` migration fixed 7 siblings but missed it); `content_scripts` not owner-scoped; CORS `*` everywhere; PII in logs.
- **`.env` is git-tracked** (`.gitignore` covers `*.local`, not `.env`). Only public `VITE_` vars today, so no leak yet, but a trap — `git rm --cached .env` and gitignore it.

### Confirmed safe (do **not** "fix")
No hardcoded secrets in `src/` or `functions/`; `stripe-webhook` verifies the Stripe signature; `cancel-subscription`, `get-chatbot-url`, `get-metrics-dashboard`, `mock-exam-mark`, `analyze-image` authenticate correctly (copy `get-metrics-dashboard`'s pattern); `user_roles` has no client write policy (no self-promotion to admin); core owner-scoped tables use `auth.uid()` correctly.

**Two manual actions the code cannot answer:**
1. Check the live `users` SELECT policy in the Supabase dashboard.
2. Treat every unauthenticated service-role function above as *compromised-if-scanned* — rotate anything sensitive and review logs.

---

## 3. PAYMENTS — access & revenue leaks (detail: `docs/audit/audit-payments.md`)

- **P0** — `admin-cancel-stripe-sub` unauthenticated (also in §2).
- **P1** — **`check-subscription` treats `past_due` as active and "heals" access** (`index.ts:9,76-120`): a failing-card customer keeps full deluxe access for the entire dunning window without paying.
- **P1** — **No refund/dispute/chargeback handling.** `stripe-webhook` has no `charge.refunded` / dispute case → refunded lifetime "Exam Season Pass" buyers keep access until 2026-06-30 (no sub to cancel; cancel refuses lifetime).
- **P1** — **Webhook idempotency race + non-idempotent affiliate insert** (`stripe-webhook:22-53,330`): `'processing'`/`'failed'` events can reprocess; `affiliate_referrals` has no `stripe_session_id` dedup → **duplicate commission payouts**.
- **P1** — **B2B school payment provisions nothing** (`stripe-webhook:222-227`): `school-checkout` writes no rows and the `school_license` branch is a no-op → paying schools get no seats; cancellation doesn't sync.
- **P2** — Hardcoded price fallbacks `monthly_price || 899` / `lifetime_price || 1699` (`create-checkout:127,150`) — CLAUDE.md violation, also breaks on a legitimate 0. `invoice.payment_failed` does nothing. Post-payment access waits entirely on the webhook (`verify-payment` grants nothing) → visible "I paid, nothing happened" window with no client retry. Two divergent entitlement sources (`check-subscription` global `is_premium` vs `productAccess.ts` per-product) can disagree — **this is your "out of sync" symptom.**
- **Verified OK:** signature verification; happy-path cancel (`cancel_at_period_end` + webhook deactivation); `uniq_active_user_product_subscription` guard; `cancel-subscription`'s manual JWT auth.

---

## 4. PERFORMANCE & SCALE (detail: `docs/audit/audit-performance.md`)

- **P0** — **RAG transfers the whole corpus per message and scores in JS.** `rag-chat:444-447` selects `document_chunks` by `product_id` with **no limit** then keyword-scores in memory; `match_documents()` + `idx_document_chunks_embedding` (`20260115114606`) are never called. Repeated in `suggest-followups:110` and `rag-chat:981`. Every chat turn = full-table transfer + JS sort × concurrency. **Core lag driver.** (Same root as §5.)
- **P0** — **React Query is installed but used 0 times; auth/access re-fetched uncached on every route.** `checkProductAccess` (`productAccess.ts:14`) does 2–4 round-trips per call and runs from `Header.tsx:204` on every route; `DashboardPage:81-90` fires it 8× (~25 queries/load); `AuthContext:87` calls `check-subscription` on every mount (which can make synchronous Stripe calls).
- **P1** — **No route-level code splitting.** `App.tsx:12-59` static-imports all 51 pages; no `manualChunks` in `vite.config.ts`. three.js, recharts, framer-motion, katex, html2pdf all ship to the marketing homepage.
- **P1** — **Unindexed `created_at` `count(*)` seq scans** in `metrics-snapshot:50-58`, `get-metrics-dashboard:229-279`, `get-analytics:24` on `chat_messages`/`chat_conversations`/`users`; **client polling** amplifies them (`AnalyticsPage` 30s, `MetricsDashboard` 5min, `MockExamResultsPage` 5s, `BuildPage`).
- **P2** — `AuthContext` value not memoised (`:202`, whole-tree re-render); `React.lazy` declared inside render (`ChatbotSidebar:178-184`, remounts); missing `user_subscriptions(user_id,product_id)` composite index for the hot access check.

---

## 5. CONTENT TRAINING & RAG QUALITY (detail: `docs/audit/audit-training-rag.md`)

**Headline:** marketed/architected as RAG, but live retrieval is **keyword substring counting**, not semantic search. Full vector infra exists and is paid for on every ingest, then never read.

- **CRITICAL** — **Retrieval is keyword matching.** pgvector + ivfflat index + `match_documents` RPC + 1536-dim `text-embedding-3-small` embeddings all exist, but `rag-chat` never embeds the query or calls the RPC — it scores `text.split(kw).length-1` over all chunks (`:411-447`). No synonym/paraphrase handling; ranking dominated by term frequency + chunk length. **Root cause of most "ignored the spec" complaints.**
- **CRITICAL** — **Chat silently truncates at 1000 chunks/product** (PostgREST default, no `.limit()` at `:444-447`). Subjects with full past papers exceed this; content past row 1000 is unreachable in arbitrary order.
- **CRITICAL** — **AI diagram matcher is dead code.** `rag-chat:141` passes `model: MODELS.main`, but `MODELS` only defines `fast`/`utility` (`:13-16`) → the call always fails and silently falls back to naive substring matching. One-line fix.
- **HIGH** — Metadata drift: `deploy-subject` spec chunks carry only `{content_type,type}` (`:237`); legacy ingesters set `topic`+`spec_id`+`section`+`year`. Effect: bare `[SPECIFICATION]` headers (model can't see the topic), inconsistent ranking, recency bonus never applies to Build-portal content. `ingest-documents`/`ingest-school-material` write no `content_type` → bucketed `'general'`, deprioritised.
- **MEDIUM** — Mark-scheme level descriptors split across fixed 1000/200-char chunks (marking accuracy hit); no reranking; length-biased scoring; greedy 25k-char cap; dedup by index only. **Model choice:** chat essay marking runs on Gemini 2.5 **Flash** but `mock-exam-mark` uses **Pro** — inconsistent on the accuracy-critical task, and `model-comparison.mjs` only benchmarks latency/cost, not marking quality. Safeguarding screen runs on the cheapest `flash-lite`. Past-paper re-ingest (`ingest-chemistry-papers`, `ingest-physics-papers`, `ingest-content`) is **not idempotent** → duplicate chunks that double-weight scoring.

**Recommended target architecture:** hybrid retrieval (vector via existing `match_documents` + keyword) → unified chunk metadata schema across all ingest paths → route marking/safeguarding to a stronger model (Pro / Claude Sonnet) with a real rubric eval → semantic chunking + idempotent delete-then-insert everywhere.

---

## 6. CORRECTNESS & DATA INTEGRITY (detail: `docs/audit/audit-correctness.md`)

*(All outside the B1–B16 Build-portal catalogue.)*

- **P1** — **ChallengePopup overwrites real grades.** `ChallengePopup.tsx:179-186,206-213` upsert `user_preferences` with hardcoded `year:'Year 13', predicted_grade:'C', target_grade:'A'`. A GCSE student submitting a challenge has their actual year/grades rewritten to A-Level defaults → corrupts the profile, poisons RAG personalisation, violates the no-hardcoded-A-Level rule.
- **P1 (referral cluster)** — Existing users can self-serve free premium (`useReferralCapture.ts:36-56` processes referrals for any logged-in user, not just new signups); `process-referral` trusts an unauthenticated `referred_user_id` (`config.toml:111`); grants 7 days deluxe across *every* product; codes are single-use per referrer and the link silently rotates after the first use.
- **P1** — **Email idempotency:** `weekly-progress-email` has no "sent this week" ledger → retries re-mail everyone. `send-feedback-emails` `listUsers()` is unpaginated (`:234`, perPage=50) → only the first 50 users ever get the free-tier email.
- **P1** — **Duplicate active `user_subscriptions` rows REVOKE access:** `productAccess.ts:31-37` `.maybeSingle()` nulls out on >1 active row → denies a paying user; `process-referral:141-179` can create such duplicates. *(Sacred file — flagged, not fixed.)*
- **P1** — **Cross-user localStorage leakage on shared devices:** `signOut` (`AuthContext.tsx:185`) clears nothing; global keys (`qualification_level`, `preferred-subject`, `pending_referral_code`, `affiliate_code`, `build_selected_project_id`) leak across account switches → GCSE↔A-Level bleed, next-user referral completion. Children's-Code-adjacent.
- **P2** — `update-streak` uses UTC day boundary (`:53-54`) → off-by-one for UK/BST late-night study; streaks recorded with the anon key so `update-streak` trusts a spoofable body `user_id` (`RAGChat.tsx:632`); subject-specific challenge leaks onto other subjects (`RAGChat.tsx:501-521`); `AuthContext` re-runs `check-subscription` on every token refresh and the client users-row insert races the `handle_new_user` trigger and swallows failure → `profile` null.

---

## 7. Cross-cutting root causes (fix the cause, not each symptom)

1. **`verify_jwt=false` + service-role + `CORS:*` as a default.** Powers the entire §2 P0 cluster. The fix is a single reusable "require authenticated caller (and verify ownership / admin / shared-secret)" guard applied to every function that isn't a signed webhook. Copy `get-metrics-dashboard`'s pattern.
2. **Body-param `user_id` trusted instead of the JWT subject.** Same functions. Derive the user from the verified token, never the request body.
3. **The vector pipeline is half-wired.** Embeddings written, never read. One correct `match_documents` call reclaims both performance and quality.
4. **Two entitlement sources of truth** (`is_premium` global vs `productAccess` per-product) → the "out of sync" billing feel. Pick `productAccess` as canonical; make `check-subscription` write through it.
5. **Lovable-generated half-wiring:** dead code, swallowed errors + success toasts, non-idempotent inserts, unpaginated `listUsers`, unmemoised context. Systemic, low-severity individually, corrosive in aggregate.

---

## 8. Recommended sequencing

**Phase 0 — Emergency (this week, mostly one repeatable auth guard):**
1. Confirm the live `users` SELECT policy in the dashboard (§1.2).
2. Add the auth/ownership guard to the P0 unauthenticated functions: `update-system-prompt`, `get-feedback`, `get-analytics`, `delete-training-upload`, `update-brain-profile`, the `ingest-*`/`process-training-file` set, and fix `school-accept-invite`'s `if (authHeader)` hole. *(non-Sacred — proceed on nod)*
3. `admin-cancel-stripe-sub` + `deploy-subject` guards — **billing-adjacent, present diff + sign-off.**
4. Tighten `document_chunks` and storage RLS (paywall + school-material isolation) — **new migration, sign-off.**
5. `git rm --cached .env` + gitignore.

**Phase 1 — Biggest user-visible wins (no migration):**
6. Wire `rag-chat` to `match_documents` (hybrid vector+keyword) and add `.limit()` — kills the lag *and* the quality complaint. *(edge fn; the `content_type` filter wants a small new migration → sign-off)*
7. Fix the `MODELS.main` dead-code diagram matcher (one line).
8. Front-end: route-level `React.lazy` + `manualChunks`; actually use React Query for `checkProductAccess`; stop re-checking access on every route.

**Phase 2 — Billing correctness:** `past_due` handling, refund/dispute webhook cases, webhook idempotency + affiliate dedup, B2B provisioning. *(Sacred — plan + sign-off each.)*

**Phase 3 — Correctness cleanup:** ChallengePopup grades, referral-abuse cluster, email idempotency/pagination, localStorage clear on sign-out.

**Phase 4 — RAG quality:** unified chunk metadata, model routing for marking + a rubric eval, semantic chunking, idempotent ingest. Dovetails with Build-portal WS-6.

**Phase 5:** Build-portal remediation plan (WS-1…WS-11) as already written.

---

## 9. What needs your explicit sign-off before any code

Per CLAUDE.md, these are Sacred / production-mutating:
- `productAccess.ts` (Phase 3 duplicate-row fix, Phase 1 caching) — Sacred.
- `stripe-webhook/**`, `create-checkout/**`, `cancel-subscription` (Phase 2) — Sacred.
- Any **new migration** (RLS tightening, `match_documents` `content_type` filter, `document_chunks`/storage policies, `created_at` indexes) — new timestamped files, but they mutate prod (no staging) → sign-off + backup first.
- `admin-cancel-stripe-sub`, `deploy-subject` — billing-adjacent → present diff.

Everything in Phase 0 items 2 and Phase 1 items 6–8 (except the migration) is non-Sacred and can proceed on a nod.

---

## 10. Where the evidence lives
- `docs/audit/audit-security.md`
- `docs/audit/audit-payments.md`
- `docs/audit/audit-performance.md`
- `docs/audit/audit-training-rag.md`
- `docs/audit/audit-correctness.md`
- `docs/build-portal-remediation-plan.md` (B1–B16, unchanged)
