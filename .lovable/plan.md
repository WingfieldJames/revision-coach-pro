

## Fix Dynamic Past Paper Finder for All Subjects

### Problem
The Past Paper Finder is broken for all dynamic (trainer-deployed) subjects. Two root causes:

1. **No `search_only` mode in `rag-chat`**: The frontend sends `{ search_only: true }` expecting JSON back, but the edge function ignores this flag and returns an SSE stream. JSON parsing fails silently, results always empty.

2. **Content type mismatch**: The `detectContentTypePriorities` function only knows legacy types (`paper_1`, `paper_2`, `paper_3`). Trainer-deployed subjects use `past_paper`, `past_paper_qp`, `past_paper_ms`, `combined`. These are never matched.

### How it Actually Works (No Index Needed)
The system already stores all past paper chunks with embeddings in `document_chunks`. There's a `match_documents` Postgres function that does vector similarity search. The current `fetchRelevantContext` fetches ALL chunks into memory and filters — this works for chat but is wasteful for search. The `search_only` mode should use the existing `match_documents` RPC for proper semantic search against embeddings.

### Plan

#### 1. Add `search_only` branch to `rag-chat/index.ts` (~line 370)
- Parse `search_only` from request body
- When true: call `match_documents` RPC with an embedding of the query, filter results to paper-related content types, return plain JSON `{ results: [...] }`
- Skip all chat logic (usage tracking, streaming, system prompt)
- Generate query embedding via Lovable AI embeddings endpoint
- Filter to paper content types: `paper_1`, `paper_2`, `paper_3`, `mark_scheme`, `past_paper`, `past_paper_qp`, `past_paper_ms`, `combined`
- Return top 15 results sorted by similarity

#### 2. Update `detectContentTypePriorities` in `rag-chat/index.ts`
- Add dynamic content types (`past_paper`, `past_paper_qp`, `past_paper_ms`, `combined`) alongside legacy types in the past paper detection block
- This also fixes the main chat when students ask about past papers

#### 3. Fix `DynamicPastPaperFinder.tsx` response handling
- Add defensive try/catch around JSON parsing
- If response is SSE (starts with `data:`), extract first JSON object as fallback
- Ensure content type filter includes both legacy and dynamic types

### Files Changed
- `supabase/functions/rag-chat/index.ts` — add `search_only` branch with embedding search + update content type constants
- `src/components/DynamicPastPaperFinder.tsx` — defensive response parsing + broader content type filter

