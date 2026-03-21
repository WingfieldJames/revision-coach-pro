

# Fix Chatbot Crashes: Context Cap + Smarter Retrieval

## The Problem

The `rag-chat` function fetches up to 50 chunks via keyword matching, producing system prompts of 120K+ characters. This exceeds AI model limits and causes timeouts/crashes.

## The Fix (Two Parts)

### Part 1: Immediate Crash Fix — Cap Context Size

**File: `supabase/functions/rag-chat/index.ts`**

- Add `MAX_CONTEXT_CHARS = 40000` constant
- In the chunk selection loop (lines 326-418), stop adding chunks once total character count exceeds the cap
- The system prompt from the `products` table (already defined in Build) stays untouched — we only cap the training data context that gets appended
- Update CORS headers (line 6) to include missing `x-supabase-client-*` headers
- Improve error responses for 500/timeout — return user-friendly messages instead of raw gateway errors

### Part 2: Smarter Retrieval — AI-Generated Search Queries

Instead of naive keyword matching against 50 chunks, use a fast AI call to generate better search terms. The system prompt is already in the DB from Build — this step only generates search queries, not the final response.

```text
Current:
  User message → keyword split → match 50 chunks → 120K context → crash

Proposed:
  User message → AI generates 3 search queries (fast, ~0.5s) 
  → fetch top 5 chunks per query (15 total, ~20K chars)
  → build final prompt with system_prompt_deluxe + capped context
  → reliable response
```

**How it works in `rag-chat/index.ts`:**

1. **Query Planning** — A tiny AI call (~200 tokens) takes the user's message and outputs 3 focused search queries as JSON. Example: "explain fiscal policy effects on unemployment" becomes `["fiscal policy government spending", "unemployment multiplier effect", "AD AS diagram inflation"]`

2. **Targeted Retrieval** — For each AI-generated query, run the existing keyword scoring against chunks. Take top 5 per query, deduplicate. ~15 high-relevance chunks instead of 50 random ones.

3. **Final Response** — Build the system prompt exactly as now: `system_prompt_deluxe` (from Build) + personalization + brain profile + capped training context. Send to AI for the real response.

The system prompt defined in Build is NOT involved in Step 1 — that step only generates search queries. The full system prompt is used in Step 3 as it already is today.

### Part 3: Client-Side Error Handling

**File: `src/components/RAGChat.tsx`**

- Catch gateway errors gracefully — show "Something went wrong, please try again" instead of raw error strings
- Add a retry button on failed messages

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/rag-chat/index.ts` | Context cap, two-step retrieval, CORS fix, better error responses |
| `src/components/RAGChat.tsx` | Graceful error messages, retry button |

