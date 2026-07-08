# Lovable Exit + Auth Hardening + Rate Limiting — Implementation Plan

**Status:** in progress. Foundation being built; per-function migration to follow.
**Owner decisions (locked):** (1) embeddings → **OpenAI-direct @ 1536-dim** (no re-index); (2) marking/safeguarding → **Claude Sonnet** (`claude-sonnet-5`) with Gemini fallback; (3) inbound rate limiting → **Postgres token-bucket**.
**Companion docs:** `docs/full-audit-2026-07.md` (why), `docs/audit/*.md` (evidence).

---

## 0. What this delivers, and why it's one pass

Three problems share the same 16 edge functions, so we fix them in **one edit per function** instead of three passes:

1. **Security (P0):** ~15 functions run `verify_jwt=false` + service-role + `CORS:*` with no caller auth → add an auth/ownership guard.
2. **Lovable exit:** those functions call `https://ai.gateway.lovable.dev/...` with `LOVABLE_API_KEY` → route through a shared AI client that talks to Google/OpenAI/Anthropic directly.
3. **Rate limiting:** none exists → the shared client enforces a per-user Postgres token-bucket.

The linchpin is a **shared module** (`supabase/functions/_shared/`) so vendor, auth, rate-limit, and cost-logging logic lives in exactly one place. Supabase supports a `_shared` folder imported via relative path from each function.

**Deployment safety:** edge functions and migrations deploy via the Supabase CLI (`supabase functions deploy`, `supabase db push`), **not** via the Vercel git push. So committing these changes to `main` does NOT auto-deploy them — they go live only when explicitly deployed. This de-risks the whole migration. (Confirm no GitHub Action auto-deploys functions before relying on this.)

---

## 1. The shared foundation (`supabase/functions/_shared/`)

### 1.1 `http.ts` — CORS + JSON helpers
- `corsHeaders`, `preflight(req)`, `json(body, status)`, `err(message, status)`. Replaces the copy-pasted CORS block in every function. (CORS stays `*` for now — tightening the allow-list is a separate low-risk follow-up.)

### 1.2 `auth.ts` — the auth guards (copy of the `get-metrics-dashboard` pattern)
- `requireUser(req)` → creates an anon client with the caller's `Authorization` header, calls `auth.getUser()`, throws a `Response(401)` if absent. Returns `{ user, admin }` where `admin` is a service-role client.
- `requireAdmin(req)` → `requireUser` + checks `user_roles` for `role='admin'`; throws `403` otherwise.
- `requireOwnedProject(req, productId)` → `requireUser` + verifies the user owns/trains that subject (via `trainer_projects`/`products`), throws `403`.
- `requireCronSecret(req)` → checks a `x-cron-secret` header against `Deno.env.get('CRON_SECRET')` for scheduled functions.
- **Derive `userId` from the verified token, never from the request body.** This closes the body-`user_id` IDOR class (`process-referral`, `update-streak`, `update-brain-profile`, `school-accept-invite`).

### 1.3 `rateLimit.ts` — Postgres token-bucket
- `checkRateLimit(admin, { key, limit, windowSec })` → upserts a counter row in `rate_limits` keyed on `(bucket_key, window_start)`; returns `{ ok, remaining, retryAfter }`. Throws `Response(429, Retry-After)` via helper `enforceRateLimit(...)`.
- `key` is normally `user:<uid>:<fn>`; for genuinely public endpoints fall back to `ip:<hash>:<fn>` from `x-forwarded-for`.
- Sensible defaults per class: chat/marking ~30/min per user; ingest/deploy ~10/min; email/cron unlimited (guarded by secret instead).

### 1.4 `ai.ts` — the vendor-swappable AI client (the linchpin)
Exports:
- `MODELS` — semantic aliases → concrete `{provider, model}`:
  - `chat` → Gemini `gemini-2.5-flash`
  - `fast` → Gemini `gemini-2.0-flash-lite`
  - `utility` → Gemini `gemini-2.5-flash-lite`
  - `marking` → **Claude `claude-sonnet-5`** (fallback Gemini `gemini-2.5-pro`)
  - `safeguarding` → **Claude `claude-sonnet-5`** (was flash-lite — upgraded)
  - `embedding` → **OpenAI `text-embedding-3-small`** (1536-dim, unchanged)
- `chatCompletion({ model, system, messages, maxTokens, jsonSchema? })` → normalises across two wire formats:
  - **OpenAI-shaped** (Gemini via Google's OpenAI-compat endpoint `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, key `GEMINI_API_KEY`; strip the `google/` prefix from model names).
  - **Anthropic** (`https://api.anthropic.com/v1/messages`, headers `x-api-key: ANTHROPIC_API_KEY` + `anthropic-version: 2023-06-01`; `system` is top-level, not a message; **do not send `temperature`** — rejected on Sonnet 5; extract only `text` blocks from `content`, skip `thinking` blocks).
  Returns `{ text, usage }` uniformly regardless of provider.
- `embed(text)` → OpenAI `https://api.openai.com/v1/embeddings`, `OPENAI_API_KEY`, `text-embedding-3-small`. Returns `number[1536]`.
- Cross-cutting, all in one place: **retry with exponential backoff + jitter** on 429/5xx; **timeout** via `AbortController`; **per-call cost logging** to `ai_usage_log` (best-effort, never throws); a **model-fallback** hop (marking: Claude → Gemini Pro on hard failure).

### 1.5 New migration `<ts>_ai_infra.sql` (additive, needs sign-off)
- `rate_limits(bucket_key text, window_start timestamptz, count int, primary key(bucket_key, window_start))` + index; RLS on, no client policy (service-role only writes).
- `ai_usage_log(id, fn text, provider text, model text, input_tokens int, output_tokens int, cost_usd numeric, user_id uuid, created_at)` — feeds a real per-feature spend dashboard. RLS on, admin-read only.
- Additive DDL only, no data mutation → low risk, but still a prod migration (no staging) → **owner sign-off before `db push`.**

### 1.6 New Supabase secrets to set (dashboard → Edge Functions → Secrets)
`GEMINI_API_KEY`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `CRON_SECRET`. `LOVABLE_API_KEY` stays until cutover is verified, then **rotate/remove**.

---

## 2. Per-function migration (the 16 + the auth-only set)

Each function gets a single edit that, as applicable: (a) swaps its CORS/JSON block for `_shared/http.ts`; (b) adds the right auth guard; (c) routes AI calls through `_shared/ai.ts`; (d) gets rate-limited by the client. Categorised by required auth:

**User-facing (requireUser + rate limit):** `rag-chat`, `suggest-followups`, `analyze-image`, `find-diagram`, `generate-revision-guide`, `mock-exam-mark`, `update-brain-profile`, `update-streak`, `process-referral`.

**Trainer/admin-facing (requireAdmin or requireOwnedProject):** `update-system-prompt`, `deploy-subject` ⚠️, `parse-specification`, `process-training-file`, `ingest-documents`, `ingest-school-material`, `delete-training-upload`, `erase-training-data`, `backfill-training-data`, `detect-content-gaps`, `get-feedback`, `get-analytics`.

**Cron/scheduled (requireCronSecret):** `churn-detection`, `daily-digest`, `conversion-nudges`, `weekly-progress-email`, `send-feedback-emails`, `exam-season-scheduler`, `metrics-snapshot`, `escalate-bad-responses`, `analyze-feedback`, `detect-content-gaps` (if cron-run).

**AI-only (no auth change, just vendor swap):** any of the above already-guarded, plus `find-diagram`/`analyze-image` (already `verify_jwt=true`).

**⚠️ Billing-adjacent — present diff + owner sign-off before applying:** `deploy-subject`, `admin-cancel-stripe-sub`. Not touched by the vendor swap except `deploy-subject`'s embeddings call.

**Special cases:**
- `school-accept-invite` — fix the `if (authHeader)` hole (JWT only checked when a header is sent); require the header.
- Embeddings callers (`deploy-subject`, `ingest-documents`, `ingest-school-material`, `process-training-file`) — swap gateway `/v1/embeddings` → `_shared/ai.ts` `embed()` (OpenAI-direct, same 1536-dim, no data change).

---

## 3. Model-string translation (Lovable → direct)

| Lovable gateway string | Direct call |
|---|---|
| `google/gemini-2.5-flash` | Gemini OpenAI-compat, model `gemini-2.5-flash` (strip `google/`) |
| `google/gemini-2.0-flash-lite` | `gemini-2.0-flash-lite` |
| `google/gemini-2.5-pro` | marking → route to Claude `claude-sonnet-5` (Gemini Pro as fallback) |
| `text-embedding-3-small` (gateway `/v1/embeddings`) | OpenAI `/v1/embeddings`, unchanged |

All model choices come from `MODELS` in `ai.ts` — **no model string hardcoded in a function** after migration.

---

## 4. Verification (no test runner)

- **Type/lint:** `npm run lint`; the shared module is Deno TS — validated by careful review + `deno check` if available.
- **Functional:** deploy each function to a Supabase branch/preview if one exists; otherwise deploy one low-risk function first (`suggest-followups`) and exercise it, confirm Gemini-direct works and rate limiting fires, before rolling the rest.
- **Cutover check:** grep for any remaining `ai.gateway.lovable.dev` / `LOVABLE_API_KEY` → must be zero before removing the secret.
- **Auth check:** curl each formerly-open endpoint with no `Authorization` header → must return 401/403, not 200.
- **Cost check:** confirm `ai_usage_log` rows appear and the numbers look sane.

---

## 5. Sequencing

1. **Foundation** — `_shared/{http,auth,rateLimit,ai}.ts` + the `ai_infra` migration (sign-off) + set secrets.
2. **Prove the pattern** — migrate `suggest-followups` (AI swap + requireUser + rate limit) and `update-system-prompt` (P0 auth) end-to-end; deploy + verify.
3. **Fan out** — the remaining user-facing + trainer/admin functions (delegated in batches, each following the locked pattern).
4. **Cron set** — `requireCronSecret` + wire the scheduler to send it.
5. **Billing-adjacent** — `deploy-subject` (embeddings + auth) and `admin-cancel-stripe-sub` (auth), each with a diff for sign-off.
6. **Cutover** — flip all traffic off Lovable, verify grep-clean, rotate `LOVABLE_API_KEY`.
7. **Fully leave Lovable (separate small PR)** — remove `lovable-tagger` from `vite.config.ts`/`package.json`, delete `.lovable/`, disconnect Lovable's GitHub write access.

---

## 6. Follow-ups this unlocks (not in this pass)
- Per-user monthly **token budget cap** enforced in `ai.ts` (free vs paid).
- **Observability** (Sentry) — errors currently swallowed.
- **RAG vector fix** (`rag-chat` → `match_documents`) — separate change; embeddings are now direct so the vector path is ready.
- CORS allow-list tightening; a real **staging environment**.
