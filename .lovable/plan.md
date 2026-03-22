

# Fix Past Paper Finder: Stop-Word Filtering + Clean Query

## Problem

The Past Paper Finder always returns the same first questions regardless of topic. Root cause is two-fold:

1. **Client sends polluted query**: `"Find past paper questions about: externalities"` — the words "find", "past", "paper", "questions", "about" all become search keywords and match EVERY paper chunk equally, drowning out the actual topic.

2. **No stop-word filtering in edge function**: The scoring splits on whitespace and counts raw keyword frequency. Common words dominate, so the first chunks in the array always win.

## Changes

### 1. Client: Send clean query (`src/components/DynamicPastPaperFinder.tsx`)

- Remove the `"Find past paper questions about: "` prefix — send only the raw topic text
- When a spec point is selected, also send the spec point's `content` field as a `spec_content` parameter so the edge function has richer keywords to match against

### 2. Edge Function: Add stop-word filtering + spec_content support (`supabase/functions/rag-chat/index.ts`)

In the `search_only` block (~line 627-676):

- Add a stop-word set: `"the", "and", "for", "about", "find", "past", "paper", "questions", "with", "how", "what", "does", "this", "that", "are", "was", "were", "been", "have", "has", "from", "will", "can", "not", "but", "all", "its", "use", "using", "which", "their", "there", "than", "into", "also", "such", "each", "other", "these", "those", "them", "they", "would", "could", "should", "may", "might", "must"`
- Filter keywords through stop-word list before scoring
- Accept optional `spec_content` field from request body — extract additional keywords from it
- Give bonus weight to matches in metadata fields (`topic`, `question_number`, `section`) vs just content body — metadata matches indicate stronger relevance (2x weight)

**Scoring change:**
```text
Current:  "Find past paper questions about externalities"
Keywords: ["find", "past", "paper", "questions", "about", "externalities"]
Result:   Every paper chunk scores high on "past", "paper" → first chunks always win

Fixed:    query = "externalities"
Keywords: ["externalities"] (after stop-word removal)
Result:   Only chunks mentioning externalities score > 0
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/rag-chat/index.ts` | Stop-word filtering, spec_content keyword extraction, metadata bonus in search_only block |
| `src/components/DynamicPastPaperFinder.tsx` | Remove "Find past paper questions about:" prefix, send spec_content field |

