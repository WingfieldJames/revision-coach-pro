## Goal

Change the A-Level Exam Season Pass (lifetime/one-time) price from **£24.99 → £19.99**. GCSE pricing (£17.99) stays unchanged. Monthly subscription pricing also stays unchanged.

## Current state

- **Database**: All 19 A-Level products in `products` have `lifetime_price = 2499` (pence). GCSE products are at `1799`.
- **Frontend / edge functions**: The £24.99 figure is also hardcoded in 11+ places, so the DB update alone will not change what users see on marketing/checkout UI. These all need to be updated in lockstep.

## Changes

### 1. Database (data update via insert tool)

Update `products.lifetime_price` from `2499` → `1999` for all rows where `qualification_type = 'A Level'`. Affects 19 products (every AQA / Edexcel / OCR / CIE A-Level subject).

GCSE rows (`1799`) untouched. Monthly prices untouched.

### 2. Frontend hardcoded `£24.99` → `£19.99`

- `src/pages/ComparePage.tsx` (line 217) — A-Level price object
- `src/pages/ProfilePage.tsx` (lines 305, 380) — Exam Season Pass upsell copy
- `src/pages/DashboardPage.tsx` (line 463) — pricing display
- `src/components/ChatbotSidebar.tsx` (line 635) — A-Level branch of ternary
- `src/components/ChatbotToolbar.tsx` (line 330) — A-Level branch of ternary
- `src/components/Header.tsx` (line 597) — A-Level branch of ternary
- `src/components/DiagramFinderTool.tsx` (line 140) — Exam Season Pass button
- `src/components/RAGChat.tsx` (line 1344) — Exam Season Pass button (A-Level branch)

### 3. Edge functions / fallbacks `2499` → `1999`

- `supabase/functions/create-checkout/index.ts` (line 202) — fallback when product row has no price
- `supabase/functions/deploy-subject/index.ts` (lines 114, 167) — default lifetime price applied when newly deploying an A-Level subject

### 4. Strike-through price

Leave the `£39.99` "was" price as-is — it stays as the anchor against the new £19.99.

## Out of scope

- Stripe Price IDs in `stripe_lifetime_price_id`. Checkout uses `price_data` (dynamic per session) not preset Price IDs, so no Stripe dashboard changes required — the new amount is sent to Stripe at checkout time.
- Existing active subscriptions. Already-purchased Exam Season Passes are untouched.
- GCSE pricing.

## Verification after build

1. Re-query `products` to confirm all A-Level rows now show `1999` and GCSE rows still show `1799`.
2. Spot-check ComparePage, ChatbotSidebar, Header upsell, and Profile upsell render `£19.99`.
3. Trigger a test checkout on an A-Level product and confirm Stripe charges £19.99.