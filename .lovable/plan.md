

## Problem Analysis

After deep-diving the code, I found **three distinct bugs** causing deluxe users to be incorrectly blocked:

### Bug 1: rag-chat edge function doesn't support bundled product access

The server-side tier check in `rag-chat/index.ts` (lines 482-510) queries `user_subscriptions` with an exact `product_id` match:

```
.eq('user_id', user_id)
.eq('product_id', product_id)  // Only checks THIS exact product
.eq('active', true)
```

For bundled products (e.g., Edexcel Maths Applied), the user's subscription is under the **parent** product (Edexcel Maths Pure). The edge function doesn't know about `BUNDLED_SLUGS`, so it sees the user as `free` and applies prompt limits.

### Bug 2: `promptProductId` prop was added but never sent to the edge function

The `promptProductId` prop was defined in `RAGChat.tsx` but **never included in the fetch body** (line 327-347). The request always sends `product_id: productId`, so the server has no way to look up the parent product for tier verification.

### Bug 3: No fallback tier check when exact product_id has no subscription

Even for non-bundled products, if a user's subscription row has a slightly different `product_id` (e.g., from a migration or slug mismatch), the server defaults to `free` with no fallback.

## Fix Plan

### 1. Update `rag-chat/index.ts` — Add bundled product tier verification

Add the same `BUNDLED_SLUGS` concept server-side. When the exact `product_id` check finds no deluxe subscription:
- Look up the product's slug
- Check `BUNDLED_SLUGS` for parent slugs
- Query `user_subscriptions` for parent product IDs
- Grant deluxe if found

This is the critical fix — the server is the source of truth for tier, not the client.

### 2. Update `RAGChat.tsx` — Send `prompt_product_id` to the edge function

Add `prompt_product_id: promptProductId || productId` to the fetch body so the edge function can use it for usage tracking (daily prompt counting uses the shared product ID).

### 3. Update `rag-chat/index.ts` — Use `prompt_product_id` for usage counting

When checking/incrementing daily usage for free-tier users, use `prompt_product_id` (if provided) instead of `product_id`. This ensures Pure and Applied share the same prompt quota.

### Files to edit

1. **`supabase/functions/rag-chat/index.ts`** — Add bundled product lookup in tier verification; accept and use `prompt_product_id` for usage counting
2. **`src/components/RAGChat.tsx`** — Send `prompt_product_id` in the fetch body

