
Got it — Gemini 2.5 Flash via Lovable AI Gateway, NOT OpenAI. I'll update the plan to reflect this throughout.

## Plan: A* AI Metrics Dashboard (Gemini-aware)

### 1. Access control
- Migration: insert `admin` role into `user_roles` for `jrrwingfield0@gmail.com` only (lookup user_id by email).
- New `/metrics` route in `App.tsx` wrapped in `AdminGuard` that calls `has_role(uid, 'admin')` and redirects non-admins to `/`.

### 2. Token logging (Gemini, not OpenAI)
Migration creates `api_usage_logs`:
```
id, user_id, product_id, feature (chat|essay|diagram|past_paper|revision_guide|mock_exam),
model (e.g. 'google/gemini-2.5-flash'),
input_tokens, output_tokens, estimated_cost_usd, created_at
```
RLS: admin-only SELECT; service-role INSERT.

Update AI edge functions (`rag-chat`, `analyze-image`, `find-diagram`, `generate-revision-guide`, `mock-exam-mark`, `analyze-feedback`) to log a row per call. Read token counts from the Lovable AI Gateway response (`usage.prompt_tokens`, `usage.completion_tokens` — OpenAI-compatible shape returned by the gateway).

**Gemini 2.5 Flash pricing** (current, USD per 1M tokens):
- Input: $0.30
- Output: $2.50

Cost = `(input_tokens/1e6 * 0.30) + (output_tokens/1e6 * 2.50)`. Stored as a constant in a shared helper inside each function (no shared module — Edge Functions can't share files).

**Historical estimate**: backfill not actually inserted into the table; instead, the dashboard computes historical cost on the fly from `daily_prompt_usage.prompt_count × avg_cost_per_prompt` (avg derived from new logged data once it exists, default ~$0.0024 fallback).

### 3. New edge function `get-metrics-dashboard` (admin-gated)
Verifies caller has `admin` role, then aggregates:

**From Stripe (live every load, ~2-3s):**
- MRR (sum of active monthly subscriptions, normalized to monthly)
- Daily gross volume (Charges API, last 30d)
- New subscribers today/week/month
- Churn rate (cancellations this period vs last)
- Refunds

**From Supabase:**
- Active subscribers by tier (A-Level monthly/season, GCSE monthly/season) via `user_subscriptions` joined to `products` (using `qualification_type` + `payment_type`)
- DAU / WAU / MAU from `daily_prompt_usage`
- Avg sessions/user, avg messages/session from `chat_conversations` + `chat_messages`
- Conversion rate + time-to-conversion (signup → first paid sub)
- AI cost per day (last 30d) from `api_usage_logs`, with historical estimate fallback
- Token usage / cost per feature
- Top 10 heaviest users by cost
- Subject mix, exam-board mix, A-Level vs GCSE split (via `products` join)
- Free vs paid usage split

**Computed alerts:**
- RED: AI cost > 15% of revenue
- RED: daily AI spend > £50
- YELLOW: DAU drop > 20% day-on-day
- YELLOW: monthly churn > 10%

Returns single JSON payload. Frontend re-fetches every 5 min.

### 4. Frontend: `src/pages/MetricsDashboard.tsx`
Layout per spec, mobile-responsive:
- **Row 1 — KPI cards:** MRR, Daily Revenue, Active Subscribers, Gross Margin %
- **Row 2 — Charts (recharts):** 30d revenue line + 30d AI cost line (side by side, stacked on mobile)
- **Row 3 — Subscribers by tier table + Engagement metrics**
- **Row 4 — Product mix:** subject bar, feature pie, A-Level vs GCSE split, exam-board breakdown
- **Bottom — Alerts panel** + Heaviest users table + Token/cost by feature
- "Last refreshed" timestamp; manual refresh button; auto-refresh interval 5 min

### 5. Build error cleanup (incidental)
The build-error list shows pre-existing TS errors in many edge functions (most are `'error' is of type unknown` and Supabase type inference issues). These are unrelated to this feature but will block deployment. I'll fix the small `error: unknown` cases in any edge function I touch for this feature, and the rest stay as they were (out of scope unless you want me to sweep them).

### 6. Out of scope (confirm if you want them in)
- Public/student-facing UI changes — none.
- Header link to `/metrics` — none (bookmark only).
- Henry/Tanuj admin access — skipped per your earlier answer; just you for now.

### Files touched
- Migration: add `api_usage_logs` table + RLS + grant `admin` role to your user
- `supabase/functions/get-metrics-dashboard/index.ts` (new)
- `supabase/functions/rag-chat/index.ts`, `analyze-image/index.ts`, `find-diagram/index.ts`, `generate-revision-guide/index.ts`, `mock-exam-mark/index.ts` — add token logging
- `src/pages/MetricsDashboard.tsx` (new)
- `src/components/AdminGuard.tsx` (new)
- `src/App.tsx` — register `/metrics` route
