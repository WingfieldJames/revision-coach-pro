# Security Audit — A* AI (React + Supabase + Stripe, minors / UK GCSE-A-Level, ICO Children's Code applies)

Read-only static review. No files modified. Date: 2026-07-08.
Evidence is `file:line`. Live exploitability not confirmed against the deployed project, but the code paths are unambiguous.

Supabase project ref: `xoipyycgycmpflfnrlty` (public anon key is embedded in the client by design — not a leak).

---

## TL;DR — the systemic root cause

`supabase/config.toml` sets `verify_jwt = false` on ~38 edge functions. That is legitimate for webhooks/public/cron **only if the function authenticates itself**. Most of them do NOT. Instead they immediately create a **service-role** client (which bypasses RLS entirely) and act on body parameters with no caller verification. Result: a large cluster of internet-facing, unauthenticated, service-role endpoints — several of which mutate the AI tutor content served to children, dump minors' PII, or destroy data.

CORS is `Access-Control-Allow-Origin: "*"` on every function, so these are also reachable from any website in a victim's browser.

---

## P0 — Exploitable now (data breach / child-safety / destructive), no authentication

### P0-1 `update-system-prompt` — anyone can rewrite the AI tutor's system prompt for a whole subject
`supabase/functions/update-system-prompt/index.ts:14-31` — no auth; service-role client (:15-18); body `{product_id, system_prompt}` written straight to `products.system_prompt_deluxe` (:26-29). `verify_jwt=false`.
That prompt is served to every student via `rag-chat` (`fetchSystemPrompt`, `rag-chat/index.ts:279-299`).
Exploit: `curl -X POST .../functions/v1/update-system-prompt -H "apikey:<public anon>" -d '{"product_id":"<uuid>","system_prompt":"<malicious persona>"}'` → mass stored prompt-injection into a minors' tutor (harmful content, data-exfil instructions, safeguarding bypass). **Highest child-safety risk.**
Fix: require verified JWT + `user_roles` admin/trainer check (copy `get-metrics-dashboard:37-51`).

### P0-2 `get-feedback` — dumps every user's email + feedback
`supabase/functions/get-feedback/index.ts:14-40` — no auth; service role; returns all `user_feedback` joined to **all** emails via `supabase.auth.admin.listUsers()` (:30-34).
Exploit: unauthenticated POST → full dump of minors' email addresses + free-text feedback. Direct GDPR / Children's Code personal-data breach.
Fix: admin JWT gate.

### P0-3 `get-analytics` — dumps all business metrics, "hidden by obscurity"
`supabase/functions/get-analytics/index.ts:18-19` literal comment `// No auth required — page is hidden by obscurity`; service role; returns total users, MRR, per-product revenue/subscriber counts, funnel/conversion (:289-320). Client (`src/pages/AnalyticsPage.tsx:157-166`) calls it with only the public anon key and no user JWT, confirming there is no server-side identity at all — the client-side `AdminGuard`/role check is pure UI theatre.
Fix: admin JWT gate; remove the anon-only call pattern.

### P0-4 `admin-cancel-stripe-sub` — anyone can cancel any customer's subscription
`supabase/functions/admin-cancel-stripe-sub/index.ts:13-31` — no auth despite the name; body `{subscriptionRowId, stripeSubId}` → `stripe.subscriptions.cancel(stripeSubId)` (:20) then marks the row inactive via service role.
Exploit: guess/enumerate a `sub_...` id → cancel a paying customer. No `user_roles` check. Stripe-adjacent — flag for sign-off before editing.

### P0-5 `deploy-subject` — anyone can re-price, unpublish, or wipe a subject's corpus
`supabase/functions/deploy-subject/index.ts:70-122` — no auth; service role; can activate/deactivate any product, set pricing (`activate_website`, hardcodes 699/899 — also violates the "no hardcoded prices" rule), overwrite `system_prompt_deluxe`, and delete `document_chunks` (`delete_specifications_only`, :89-99).
Fix: admin JWT gate.

### P0-6 RAG corpus poisoning — `ingest-documents`, `ingest-content`, `ingest-*`, `process-training-file`
`ingest-content/index.ts:38-56`, `ingest-documents/index.ts:70-105` (and `ingest-physics-papers`, `ingest-chemistry-spec`, `ingest-chemistry-papers`, `ingest-maths-spec`, `process-training-file` — all service role, none call `getUser`). Body-controlled chunks incl. `metadata.content_type` inserted into `document_chunks`, which `rag-chat` retrieves and feeds to students (`fetchRelevantContext`, rag-chat:427-485).
Exploit: inject arbitrary/harmful "mark-scheme" content into any subject's RAG corpus → served to minors. Stored prompt injection at the data layer.
Fix: admin/trainer JWT gate on all ingest/training-write functions.

### P0-7 `delete-training-upload` — unauthenticated destructive IDOR
`supabase/functions/delete-training-upload/index.ts` — service role; body `{upload_id, delete_chunks}` → deletes the `trainer_uploads` row, its `document_chunks`, and the storage object. No auth, no ownership check.
Exploit: any anonymous caller with an upload UUID destroys training data + files across every tenant.

### P0-8 `school-accept-invite` — body `user_id` trusted when no auth header is sent
`supabase/functions/school-accept-invite/index.ts:20` `let user_id = body.user_id;`, `:31 if (authHeader) {…}` — the JWT is only consulted **when an Authorization header is present**; a mismatch is only `console.warn` (:41), and with no header the block is skipped so `body.user_id` passes the `if (!user_id)` guard (:50) and all writes run under service role.
Exploit: POST `{invite_code:<valid>, user_id:<any uuid>}` with **no** auth header → marks invite accepted for an arbitrary user, increments `used_seats`, inserts `user_subscriptions` granting `tier:"deluxe"` school premium across all active products (:140-233). Grants self premium off any leaked code, burns a school's paid seats onto arbitrary accounts, attaches victim accounts to a school. (The code comment claims the opposite: "Derive user_id from auth token, not request body".)
Fix: hard-fail when the token is absent/invalid; never read `user_id` from the body; make the mismatch a 403.

### P0? — `users` table SELECT policy is NOT in the repo (verify in dashboard)
The `users` table (minors' email + `is_premium`) predates the migration history. The only policy in migrations is `20250827124853_...:9-12` (UPDATE own — correct). There is **no SELECT/INSERT policy for `users` in any migration**. If the live SELECT policy is `USING (true)`, every child's email is readable by any authenticated user — a P0 PII leak. **Must be confirmed directly in the Supabase dashboard.** Single highest-priority unknown.

---

## P1 — Serious (privilege escalation / IDOR / abuse / compliance)

### P1-1 Storage: cross-tenant read + open write of school materials/branding
`supabase/migrations/20260707120000_b2b_schools_layer.sql:441-450` — the `school-materials` and `school-branding` storage policies gate **only on `bucket_id`**, not on `has_school_role`/ownership:
```
CREATE POLICY "Staff can read school materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'school-materials');
```
Exploit: any authenticated user (any student at any school) reads **every** school's private uploaded materials and can upload arbitrary files into the private bucket. `school-branding` bucket is `public=true` (:434) so its uploads are world-readable. Contrast the correct `trainer-uploads` policy gated on `has_role` (`20260223192723_...:108-122`).

### P1-2 `update-brain-profile` — IDOR write + stored prompt injection
`supabase/functions/update-brain-profile/index.ts:15-20,100-111` — no auth; service role; trusts body `user_id` + `conversation_history`, runs it through the LLM, upserts the victim's `user_brain_profiles.profile_summary`. That summary is later injected into the victim's chat context and churn emails.
Exploit: POST `{user_id:<victim>, conversation_history:[…attacker text…]}` → overwrite any student's profile + burn AI credits.

### P1-3 Cron functions callable by anyone → mass email to minors + unbounded AI spend
No shared-secret check on: `churn-detection` (AI "we miss you" emails), `weekly-progress-email`, `send-feedback-emails` (+ a `{test_email}` mode sending to an arbitrary address, :194-210), `conversion-nudges`, `escalate-bad-responses`, `detect-content-gaps`, `analyze-feedback` (writes `prompt_improvements` appended to system prompts), `daily-digest`, `metrics-snapshot`, `exam-season-scheduler`.
Exploit: repeated unauthenticated calls = spam/harassment of students, email-domain reputation damage, uncapped `LOVABLE_API_KEY` cost.
Fix: require `x-cron-secret === Deno.env.get('CRON_SECRET')`; remove the `test_email` bypass.

### P1-4 `backfill-training-data` — unauthenticated mass mutation
`supabase/functions/backfill-training-data/index.ts` — no auth; service role; iterates all `trainer_projects` and mutates them. Data-integrity tampering + subject enumeration.

### P1-5 `erase-training-data` — role-checked but no per-project ownership
`supabase/functions/erase-training-data/index.ts:692-732` — correctly checks caller has `trainer`/`admin` (good), but never checks caller owns `project_id`; deletes all `document_chunks` for that project's `product_id` and resets its status.
Exploit: any trainer wipes another trainer's entire subject corpus.

### P1-6 `Math.random()` invite codes (not a CSPRNG)
`supabase/functions/school-invite/index.ts:11-18` — 12 chars from a 54-char alphabet built with `Math.random()`. `Math.random()` state is recoverable/predictable, and the code is the sole credential (`school-accept-invite` looks up by `invite_code` only and never checks the accepting user's email vs `invited_email`). Combined with P0-8, predicted codes fully onboard arbitrary accounts.
Fix: `crypto.getRandomValues()` / `crypto.randomUUID()`; bind acceptance to `invited_email`.

### P1-7 Invites never expire
No `expires_at` column on the invite (`20260707120000_...`) and `school-accept-invite` only rejects rows already flagged `expired`, which nothing ever sets. A leaked code is replayable indefinitely until first accepted (single-use post-acceptance IS enforced).

### P1-8 `document_chunks` readable by any authenticated user (paywall bypass)
`supabase/migrations/20260115114606_...:25-29` — `CREATE POLICY … FOR SELECT … USING (true)`. All RAG content, including paid subjects' mark schemes and past papers, is readable by any signed-in free account directly via the Supabase client, bypassing `productAccess.ts`. Content not PII → business/paywall issue, not P0. Consider entitlement gating or moving retrieval behind a service-role edge function.

### P1-9 `rag-chat` — best-effort auth only; unauthenticated free use + user_id spoof
`supabase/functions/rag-chat/index.ts:906-923` — falls back to client-supplied `user_id` when no Authorization header. `verify_jwt=false`.
Exploit: unauthenticated callers use the paid AI tutor for free (burns `LOVABLE_API_KEY`); supplying a victim's `user_id` exhausts their free-tier daily limit (`increment_prompt_usage`, :700) and reads their preferences into the prompt.
Fix: make token derivation mandatory (reject when absent).

### P1-10 No age-assurance / DOB / parental-consent anywhere (Children's Code)
Greps across `src/` and `supabase/` for `date_of_birth|dob|birth|age_gate|age_verif|parental|guardian|under 13|consent` found only unrelated exam-content hits. There is **no age verification, DOB capture, age-gating, or parental/guardian-consent mechanism** — for a product knowingly onboarding under-16s (some under 13). Material gap vs the ICO Age Appropriate Design Code (age-assurance proportionate to risk; lawful basis for children's data; school-mediated consent for B2B). Policy/design escalation, not a one-line fix.

---

## P2 — Hardening

- **`change_log` world read/write** — `20260406160000_metrics_snapshots.sql:21` `FOR ALL USING (true) WITH CHECK (true)`, no `TO` clause → applies to `public`. The remediation migration `20260416120000_fix_admin_table_rls.sql` fixed seven sibling tables but **missed `change_log`**. Anyone can read/tamper the ops/audit log. Add the same admin-only fix.
- **`content_scripts` SELECT/INSERT not owner-scoped** — `20260412140000_content_scripts.sql:22-28` uses `auth.uid() IS NOT NULL`; the fix migration tightened only UPDATE/DELETE. Any authenticated user reads all users' scripts and can insert rows with an arbitrary `created_by` (ownership spoof).
- **`trainer_projects` deployed prompts exposed** — `20260227105335_...:1-4` `FOR SELECT USING (status='deployed')`, no ownership scope → any authenticated user reads every deployed subject's `system_prompt`/`exam_technique` (product IP).
- **`process-referral` free-premium abuse** — `process-referral/index.ts:20,123-182` — no auth; service role; grants 7-day premium to both `referral_code`'s referrer and body `referred_user_id`. Self/duplicate guards exist but no proof the caller owns `referred_user_id`. verify_jwt=false.
- **`test-affiliate`** — no auth; returns affiliate `commission_rate` for any code (enumeration).
- **CORS `*` everywhere** — replace with an origin allow-list on state-changing / PII / Stripe endpoints.
- **PII in logs** — `school-accept-invite/index.ts:57` logs the live invite **code** + `user_id`; `rag-chat/index.ts:1046` logs student message content (children's personal data); `school-checkout/index.ts:589` logs purchaser email. Redact.
- **Legacy school policies coexist with B2B layer** — `20260707120000_...` adds policies without dropping `20260408100100_school_licensing.sql:54-72`; both OR-combine, and the old set doesn't require `invite_status='accepted'`, loosening effective visibility (same-school scoped, not cross-tenant). Also `20260409100000_...:33,41` use invalid `CREATE POLICY IF NOT EXISTS` (likely never applied; both restrictive so no exposure).

---

## Hygiene / low

- **`.env` is git-tracked** (`git ls-files` → `.env`; `.gitignore` covers `*.local` but not `.env`). Its contents are only `VITE_SUPABASE_PROJECT_ID/PUBLISHABLE_KEY/URL` — all public client vars — so no secret leak today, but the tracking pattern is dangerous (a future secret added here would be committed). Add `.env` to `.gitignore` and `git rm --cached .env`.
- **Anon key duplicated** in `src/integrations/supabase/client.ts:6`, `RevisionGuideTool.tsx:60`, `AnalyticsPage.tsx:163`, `FeedbackResultsPage.tsx:119`. Public by design (JWT role `anon`), but note one copy (`RevisionGuideTool.tsx:60`) differs by a character — dead/typo'd key, harmless.
- **No hardcoded secrets found** — no `sk_live`/`sk_test`/`whsec_`/`sk-ant-`/service-role JWT in `src/` or `supabase/functions/`. All secrets read from `Deno.env`. `stripe-webhook` verifies the Stripe signature (`constructEventAsync`, :190-193). Good.

---

## Correctly secured (for contrast / do not "fix")

- `stripe-webhook` (signature-verified, idempotent), `cancel-subscription` (`getUser` + `.eq(user_id, user.id)`), `get-chatbot-url` (auth + server-side subscription check), `get-metrics-dashboard` (`getUser` + `user_roles` admin gate — the reference pattern), `mock-exam-mark`/`analyze-image` (`verify_jwt=true`, authenticated).
- **`user_roles` has NO client INSERT/UPDATE/DELETE policy** → RLS default-deny blocks self-promotion to admin; all grants are raw service-role inserts. `has_role()` is `SECURITY DEFINER SET search_path=public`. No privilege-escalation via roles.
- `user_subscriptions` (SELECT own only; writes are webhook/service-role — users cannot self-grant premium).
- Owner-scoped to `auth.uid()`: `user_preferences`, `user_streaks`, `user_mistakes`, `email_preferences`, `message_feedback`, `user_brain_profiles`, `daily_prompt_usage`, `monthly_tool_usage`, `mock_results`, `chat_conversations`, `chat_messages`, `referrals`.
- Locked/admin-gated: `affiliates`/`affiliate_referrals` (`USING(false)`), `feedback_emails_sent` (`USING(false)`), `stripe_webhook_events`, `api_usage_logs`, and the seven analytics tables fixed by `20260416120000`.
- B2B tables use `SECURITY DEFINER` helpers (`has_school_role`/`is_school_member`/`is_class_teacher`); safeguarding tables correct — `safeguarding_flags` restricted to DSL+admin (class teachers excluded), `coach_interactions`/`skill_events` student=own/teacher=own-class. No role-escalation or cross-student read via the B2B table policies (the exposure is the storage-bucket policies P1-1 and the invite functions P0-8/P1-6/P1-7).

---

## Recommended remediation order

1. Kill the unauthenticated P0 endpoints (add JWT + admin/trainer gate, pattern from `get-metrics-dashboard:37-51`): `update-system-prompt`, `get-feedback`, `get-analytics`, `deploy-subject`, all `ingest-*` + `process-training-file`, `delete-training-upload`. Fix `school-accept-invite` to reject body `user_id`. Flag `admin-cancel-stripe-sub` (Stripe-adjacent) for sign-off.
2. **Verify the live `users` SELECT policy** in the dashboard — potential P0.
3. Fix the `school-materials`/`school-branding` storage policies (gate on `has_school_role` + ownership).
4. Add `CRON_SECRET` to all cron/email functions; remove `send-feedback-emails` `test_email` bypass.
5. IDOR: derive `user_id` from JWT (reject when absent) in `update-brain-profile`, `rag-chat`, `process-referral`, `update-streak`.
6. Invite hardening: CSPRNG codes + `expires_at` + email binding.
7. RLS cleanup: `change_log`, `content_scripts` SELECT/INSERT, decide on `document_chunks` paywall.
8. CORS allow-list; strip PII from logs; `.gitignore` the `.env`.
9. Compliance: design and implement age-assurance + parental/school consent before further B2B onboarding of minors.

Note (per CLAUDE.md workflow): none of these fixes require editing the sacred files themselves, but any change to `config.toml verify_jwt`, RLS policies, or `admin-cancel-stripe-sub` should be flagged for explicit sign-off before coding.
