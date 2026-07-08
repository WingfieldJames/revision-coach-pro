# A* AI — Correctness, State Management & Data-Integrity Audit

Read-only audit. Scope: everything **outside** the Build-portal catalogue (B1–B16 in
`docs/build-portal-remediation-plan.md`). Billing (Stripe) and RAG/training are covered by other
agents; P0s spotted there are flagged briefly and left for them. Nothing was edited.

Severity key: **P0** = data corruption / auth bypass / silent data loss. **P1** = serious.
**P2** = minor / cosmetic.

---

## P1 — Referrals: existing users self-serve free premium

**File:** `src/hooks/useReferralCapture.ts:36-56`
**Also:** `supabase/functions/process-referral/index.ts:78-92, 123-182`

Step 2 of the capture hook processes a pending referral whenever `user && pendingCode` — it does
**not** check that the user just signed up. Any already-registered, logged-in student who clicks a
friend's `?ref=CODE` link gets processed as a "referred" user, and `process-referral` grants **both**
the referrer and the clicker 7 days of `deluxe` across **every product** in the catalogue
(`process-referral:127-182` loops all products). The only guard is "has this user already been a
completed `referred_id`?" (`:79-84`), so every existing user gets one free 7-day deluxe pass the first
time they touch any referral link.

**Failure scenario:** a paying/expired user shares links in a group chat; everyone who clicks —
including long-standing accounts — is upgraded to deluxe for a week across all subjects. Direct
revenue leak.

**Fix:** only process a pending referral for genuinely new accounts (e.g. compare `user.created_at`
to now within a small window, or set a flag at signup and clear it), and/or require the user to have
zero prior subscriptions.

---

## P1 — process-referral trusts an unauthenticated `referred_user_id`

**File:** `supabase/functions/process-referral/index.ts:20-27`; `supabase/config.toml:111-112`
(`verify_jwt = false`)

The function is a public endpoint (no JWT) and reads `referred_user_id` straight from the request
body with no verification against a caller token — unlike `update-streak`, which derives the id from
the auth token (`update-streak/index.ts:21-38`). Anyone who knows/harvests a valid, unused referral
code can `POST` any `referred_user_id` and grant that arbitrary account (and the code owner) 7 days of
deluxe on all products.

**Failure scenario:** scripted abuse farming deluxe access for alt accounts; or granting an unwanted
"referral" onto a third party's account.

**Fix:** derive `referred_user_id` from the verified auth token (mirror `update-streak:21-38`), or set
`verify_jwt = true` and read the caller id from the JWT.

---

## P1 — Referral codes are single-use per referrer, and the link silently rotates

**Files:** `src/hooks/useReferral.ts:44-77` (`generateReferralCode`);
`supabase/functions/process-referral/index.ts:38-51, 103-121`

`generateReferralCode` creates **one** `referrals` row per referrer (`status='pending'`), holding the
shareable code. `process-referral` fills that single row's `referred_id` and flips it to `completed`
(`:104-113`). Therefore a referrer's code works for exactly **one** referral; the 2nd+ friend to use
it hits `referral_already_completed` (`:70-76`). Worse, once completed, the next call to
`generateReferralCode` finds no `pending` row and mints a **brand-new different code** (`:47-60`), so
the referrer's "invite link" silently changes after every successful referral — old shared links keep
resolving to the now-completed row and fail.

**Failure scenario:** the whole referral mechanic is effectively one-shot per user; virality is
broken and users see confusing "already completed / invalid" errors on links they only just shared.

**Fix:** model a code as a reusable referrer property (or one row per *referral event*), decoupled
from the `referred_id`/status of any single completion.

---

## P1 — ChallengePopup overwrites a student's real grades with hardcoded A-Level values

**File:** `src/components/ChallengePopup.tsx:179-186` (score) and `:206-213` (reflection)

Both `upsert`s into `user_preferences` use `onConflict: 'user_id,product_id'` and include hardcoded
`year: 'Year 13', predicted_grade: 'C', target_grade: 'A'`. Because upsert updates every supplied
column on conflict, submitting a challenge score or saving a reflection **overwrites the student's
actual year/predicted/target grade** with A-Level defaults. A GCSE student who had `Year 11 / 5 / 9`
is silently rewritten to `Year 13 / C / A`.

This is (a) data corruption of the student profile, (b) a direct violation of the CLAUDE.md "never
hardcode A-Level assumptions / read from `qualification.ts`" rule (contrast `MyAIPreferences.tsx:52-54`,
which correctly uses `getDefaultYear/getDefaultPredictedGrade/getDefaultTargetGrade`), and (c) feeds
wrong grade context into RAG personalisation (`RAGChat` reads `user_preferences`).

**Fix:** update only `additional_info` (and `updated_at`); never write year/predicted/target here. If
a row may not exist, seed those columns from `qualification.ts` defaults, not literals.

---

## P1 — weekly-progress-email has no idempotency / dedup guard

**File:** `supabase/functions/weekly-progress-email/index.ts:424-609`

Unlike `send-feedback-emails` (which records each send in `feedback_emails_sent` and skips duplicates,
`send-feedback-emails/index.ts:249-258, 311-320`), the weekly job has **no** "already sent this week"
record. It emails every user with a chat message in the last rolling 7 days (`:447-451`) on every
invocation. Any double-fire — cron retry, overlapping schedule, manual trigger, or a mid-run crash +
retry (the loop has no checkpoint) — re-sends the recap to everyone already processed.

**Failure scenario:** duplicate/looping weekly emails to minors; deliverability/spam-reputation hit;
possible Resend rate-limit failures.

**Fix:** add a `weekly_email_sent` (user_id, week_start) ledger checked+written per user, mirroring
the feedback-email pattern.

---

## P1 — send-feedback-emails only ever sees the first 50 users

**File:** `supabase/functions/send-feedback-emails/index.ts:234`

`supabase.auth.admin.listUsers()` is called with no pagination. The Admin API defaults to
`perPage = 50` and returns only page 1. The free-user 14-day feedback branch therefore silently
considers at most 50 accounts; once the userbase exceeds 50, the majority never receive the email and
there is no error. (The deluxe branch is unaffected — it queries `user_subscriptions`.)

**Fix:** paginate `listUsers({ page, perPage })` until exhausted, or drive the free branch off the
`users`/`user_subscriptions` tables instead of the Admin API.

---

## P1 — Duplicate active `user_subscriptions` rows silently REVOKE access (SACRED FILE — flag only)

**File:** `src/lib/productAccess.ts:31-37` (`.eq('active', true).maybeSingle()`)
**Trigger source:** `supabase/functions/process-referral/index.ts:141-179`

`checkProductAccess` resolves the active subscription with `.maybeSingle()`. If a user has **more than
one** active row for the same `product_id`, `.maybeSingle()` returns `data: null` **and** an error, so
`if (!error && subscription)` (`:39`) is false and the function returns `hasAccess: false` — a paying
user is locked out.

Duplicate active rows are readily created: `process-referral` checks for an existing active sub with
its own `.maybeSingle()` (`:141-147`) and, if duplicates already exist (that call errors → `existingSub`
undefined), **inserts yet another active row** (`:170-179`). Referral grants also leave rows
`active=true` forever with a past `subscription_end` (never deactivated), accumulating duplicates over
time. `mock-exam` / Lovable-generated rows compound this.

`productAccess.ts` is a **sacred file** — flagging, not fixing. Recommended (with sign-off): order +
`limit(1)` instead of `.maybeSingle()`, and treat "any active, in-date row" as access; separately, a
unique constraint on `(user_id, product_id) WHERE active` and a dedupe migration.

*(Billing-adjacent — noted for the Stripe agent too, but the null-out is a data-integrity/`maybeSingle`
misuse squarely in this audit's scope.)*

---

## P1 — Cross-user localStorage leakage on shared devices (GDPR / Children's Code)

**File:** `src/contexts/AuthContext.tsx:185-190` (`signOut` clears nothing app-level)

Sign-out only calls `supabase.auth.signOut()`; it never clears app localStorage. These keys are
**global, not user-scoped**, and survive an account switch on a shared device:

- `qualification_level` (`src/lib/qualification.ts:5`) — user B inherits user A's GCSE↔A-Level
  choice, which drives grade scales, year options and default grades **app-wide**
  (`getGradeScale`, `getDefaultYear`, etc.). A GCSE student on a shared school laptop can be shown
  A-Level letter grades and Year 12/13 defaults.
- `preferred-subject`, `preferred-exam-boards` (`SubjectPlanSelector.tsx`, `ComparePage.tsx`, …).
- `affiliate_code` (`useAffiliateTracking`), `pending_referral_code` (`useReferral.ts:3`) — the next
  user to log in can trigger a referral completion / affiliate attribution belonging to the previous
  visitor (compounds the referral issues above).
- `build_selected_project_id` (`BuildPage.tsx:144-149`) — one trainer's selected project persists to
  the next.

Shared school devices are the norm for this minor-heavy userbase, so this is a Children's-Code-adjacent
data-hygiene issue as well as a correctness one.

**Fix:** clear app-owned localStorage keys in `signOut` (and ideally namespace per-user keys the way
the challenge keys already do at `ChallengePopup.tsx:132`).

---

## P2 — update-streak day boundary is UTC, not UK local

**File:** `supabase/functions/update-streak/index.ts:53-54, 112-115`

"Today" is `new Date().toISOString().split('T')[0]` (UTC). During BST (exam season) the UK is UTC+1,
so a study session between 00:00–01:00 local counts as the **previous** UTC day. Off-by-one at the day
boundary for the entire UK userbase: a session just after local midnight can register as "already
active today" (no advance) or a genuine new day can be missed. The freeze logic (`:119-131`) inherits
the same skew.

**Fix:** compute the day in `Europe/London` (e.g. `Intl.DateTimeFormat('en-GB', { timeZone:
'Europe/London' })`) for `todayStr` and the diff.

---

## P2 — Streaks recorded with the anon key, not the user's JWT (spoofable); `recordActivity` is dead

**File:** `src/components/RAGChat.tsx:632-636`

The streak fetch sends `Authorization: Bearer <VITE_SUPABASE_PUBLISHABLE_KEY>` (the anon key), not the
user's session token. So `update-streak`'s token-based id derivation fails and it falls back to the
body `user_id` (`update-streak/index.ts:29-38` catch path). Any client can POST an arbitrary `user_id`
to bump someone else's streak. Cosmetic data only, but it defeats the function's own security intent.

Separately, `src/hooks/useStreak.ts:61-98` `recordActivity` (which *does* use `functions.invoke`, i.e.
the real session token) is **never called** anywhere — the app records streaks exclusively via the
hand-rolled anon-key fetch above. Dead code + the wrong path is the live one.

**Fix:** use the session access token (as in `RAGChat.tsx:652-653`) for the streak call, or route
through `recordActivity`; delete the unused hook path.

---

## P2 — Subject-specific challenge leaks onto every other subject's chat

**File:** `src/components/RAGChat.tsx:501-521`

When a subject has no active challenge, the "universal fallback" grabs **any** `trainer_project` with a
non-null `active_challenge` (top 10 by `updated_at`) and shows it (`:502-520`). There is no flag
distinguishing a broadcast/universal challenge from a subject-specific one, so a challenge configured
for one subject (e.g. Economics) surfaces on unrelated subjects (e.g. Chemistry). Distinct from B12
(which concerns the broadcast write path); this is the read path.

**Fix:** only fall back to challenges explicitly marked universal (add/read a `scope`/`universal` flag
on `active_challenge`).

---

## P2 — AuthContext: profile refresh churn + users-row insert race, swallowed insert failure

**File:** `src/contexts/AuthContext.tsx:127-133, 46-105`; trigger in migration
`20250730080504_*.sql` (`handle_new_user`)

1. `useEffect([user])` re-runs `refreshProfile` on **every** `onAuthStateChange` — including
   `TOKEN_REFRESHED`, where the `user` object identity changes. Each refresh re-invokes the
   `check-subscription` edge function (`:87`), i.e. an unnecessary Stripe round-trip on every token
   refresh, and can transiently rewrite `profile`.
2. The client auto-creates the `users` row (`:66-82`) even though a DB trigger `handle_new_user`
   already inserts it on signup. On first signup the client `SELECT` can miss the not-yet-committed
   trigger row → attempt an `INSERT` → PK conflict → `insertError` → only `console.error`; `profile`
   stays `null` until the next refresh. Self-heals (the `check-subscription` fallback at `:87-98` can
   still populate `profile`), but any consumer reading `profile?.is_premium` in that window sees a
   free/anonymous state.

**Fix:** gate `refreshProfile` on an actual `user.id` change (not object identity); make the client
insert `upsert`/`onConflict do nothing`, or drop it and rely on the trigger; surface a real error
state instead of silently leaving `profile` null.

---

## Things checked and found OK (to bound the audit)

- `conversion-nudges` **does** dedupe against the `conversion_nudges` table
  (`conversion-nudges/index.ts:145-199`) — no double-nudge.
- `send-feedback-emails` records sends before considering a user done and skips on an existing record
  (`:249-258, 311-320`) — idempotent aside from the pagination gap above.
- `daily-digest` is a single admin-facing digest, not per-user — no idempotency concern.
- `productAccess` grace logic (7-day, monthly only) and `BUNDLED_SLUGS` recursion read cleanly aside
  from the `maybeSingle` null-out above.
- Challenge/brain localStorage keys **are** correctly per-user-scoped (include `user.id`), e.g.
  `ChallengePopup.tsx:132`, `RAGChat.tsx:793` — the leakage issue is limited to the global keys listed.

---

## Suggested priority order

1. ChallengePopup grade overwrite (P1) — active data corruption, one-file client fix, no sign-off.
2. Referral existing-user grant + unauthenticated `referred_user_id` + single-use code (P1 cluster) —
   revenue + auth; fix together.
3. weekly-progress-email idempotency (P1) — duplicate mail to minors.
4. Cross-user localStorage clear on signOut (P1) — shared-device correctness/Children's Code.
5. send-feedback-emails pagination (P1).
6. productAccess duplicate-active-row null-out (P1, **sacred — sign-off**).
7. Streak UTC boundary + anon-key spoof, challenge cross-leak, AuthContext churn (P2s).
