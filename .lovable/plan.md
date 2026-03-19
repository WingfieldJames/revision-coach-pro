

## Problem

When users ask for past paper questions on a topic, the retrieval spreads 30 priority slots across 7 individual content types (`paper_1`, `paper_2`, `paper_3`, `past_paper`, `past_paper_qp`, `past_paper_ms`, `combined`), giving each only ~4 chunks. This causes patchy coverage — some papers appear, others are missed entirely. There is also no recency bias, so older papers compete equally with recent ones.

## Solution

Refactor the chunk selection logic in `supabase/functions/rag-chat/index.ts` to:

1. **Pool all past-paper types into one group** — instead of allocating slots per sub-type, merge them into a single "past papers" pool
2. **Add year-based recency boost** — chunks from 2024 get a score bonus over 2023, which gets a bonus over 2022, etc.
3. **Enforce equal paper distribution** — within the pool, distribute slots equally across paper numbers (paper 1, paper 2, paper 3, etc.) so no single paper dominates

## Changes (single file)

**`supabase/functions/rag-chat/index.ts`**

### 1. Define past paper type group constant (~line 30)
```typescript
const PAST_PAPER_TYPES = ['paper_1', 'paper_2', 'paper_3', 'past_paper', 'past_paper_qp', 'past_paper_ms', 'combined'];
```

### 2. Add recency scoring helper
Extract year from chunk metadata (`metadata.year`) and add a bonus: 2024 = +20, 2023 = +15, 2022 = +10, 2021 = +5, older = 0. This is added on top of the existing keyword relevance score.

### 3. Refactor the allocation block (~lines 307-348)

When past paper types are detected in priorities:

- Remove individual past paper types from the per-type allocation loop
- Collect all chunks matching any `PAST_PAPER_TYPES` into one merged pool
- Score each with keyword relevance + recency boost
- Determine how many distinct paper numbers exist in the data (e.g., 2 for maths, 3 for economics)
- Allocate ~75% of MAX_CHUNKS (≈37 slots) to this pool, split equally per paper number
- Within each paper-number bucket, sort by score (relevance + recency) and take the top N
- Give remaining ~25% (≈13 slots) to non-past-paper types (specification, exam technique, etc.)

When no past paper search is detected, keep the existing balanced allocation logic unchanged.

### 4. Remove `'combined'` from `detectContentTypePriorities` (~line 206)
This content type does not exist in the data and wastes a slot.

## Deployment
Edge function auto-deploys on save. No database or migration changes needed.

