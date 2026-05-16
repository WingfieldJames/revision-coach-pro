## Goal
Change the A-Level Exam Season Pass (lifetime) price from **£19.99 → £16.99**. GCSE pricing (£17.99) stays unchanged. Everything else (copy, layout, strike-through £39.99, monthly £8.99) stays exactly the same.

> ⚠️ Heads-up: after this change, GCSE Pass (£17.99) will be more expensive than the A-Level Pass (£16.99). Confirm you're happy with that — if not, lower GCSE too.

## Stripe
No Stripe dashboard change needed. `create-checkout` builds the Stripe `price_data` dynamically per session from `products.lifetime_price`. Updating the DB value flows straight through to new checkout sessions.

## Changes

### 1. Database migration
Update all A-Level products (current `lifetime_price = 1999`) to `1699`. GCSE rows (`1799`) left alone.
```sql
UPDATE public.products SET lifetime_price = 1699 WHERE lifetime_price = 1999;
```

### 2. Edge function defaults
- `supabase/functions/create-checkout/index.ts` line 150 — fallback `|| 1999` → `|| 1699`
- `supabase/functions/deploy-subject/index.ts` lines 114 & 167 — A-Level default `1999` → `1699` (GCSE `1799` untouched)

### 3. Frontend copy (£19.99 → £16.99)
- `src/components/ChatbotSidebar.tsx:647`
- `src/components/ChatbotToolbar.tsx:454`
- `src/components/DiagramFinderTool.tsx:142`
- `src/components/Header.tsx:619`
- `src/components/RAGChat.tsx:1392`
- `src/pages/ComparePage.tsx:217` (`lifetime: '£19.99'` → `'£16.99'`)
- `src/pages/DashboardPage.tsx:463`
- `src/pages/ProfilePage.tsx:305` and `:380`

## Out of scope
- GCSE pricing (£17.99) and strike-through (£39.99) unchanged
- Monthly pricing unchanged
- No UI/layout/wording changes beyond the number
