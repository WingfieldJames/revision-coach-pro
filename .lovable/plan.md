

## Problem

Edexcel Maths Pure (`edexcel-mathematics`) and Applied (`edexcel-mathematics-applied`) are separate products in the database with separate product IDs. When a user buys "Edexcel Mathematics", they only get a subscription row for the Pure product. The Applied premium page checks for a subscription against the Applied product ID, finds none, and blocks access.

The user expectation (and what was advertised) is that buying Edexcel Mathematics gives access to the entire specification — both Pure and Applied.

## Solution

Modify the **Applied premium page** (`EdexcelMathsAppliedPremiumPage.tsx`) to check for access to **either** the Applied product OR the Pure product. If the user has a deluxe subscription to `edexcel-mathematics`, they should also be granted access to the Applied chatbot.

This is the simplest fix that doesn't require database changes or modifying the subscription architecture.

### Changes

**`src/pages/EdexcelMathsAppliedPremiumPage.tsx`** — Update the `checkAccess` function to:
1. First check for a subscription to `edexcel-mathematics-applied` (as it does now)
2. If none found, also check for a subscription to `edexcel-mathematics` (the Pure product)
3. Grant access if either subscription exists

The product ID used for RAG chat and tools will be the Applied product's ID (so content isolation is preserved), but the **access gate** accepts either subscription.

**`src/lib/productAccess.ts`** — Add a mapping constant for "bundled" products so `checkProductAccess` can also be updated to respect this bundle logic (used by Dashboard and other pages):

```text
const BUNDLED_SLUGS: Record<string, string[]> = {
  'edexcel-mathematics-applied': ['edexcel-mathematics'],
};
```

When checking access for a slug that has bundle parents, also check those parent slugs. This keeps the fix centralized and extensible.

### Files to edit
1. `src/lib/productAccess.ts` — Add bundle lookup in `checkProductAccess`
2. `src/pages/EdexcelMathsAppliedPremiumPage.tsx` — Use the Pure slug as fallback in the access check
3. `src/pages/DashboardPage.tsx` — Ensure the dashboard also reflects Applied access when Pure is purchased (check if needed)

