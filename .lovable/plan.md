# Reactive Thinking UI — Edexcel Economics

Replace the static 4-line "Searching knowledge base..." block with a live, prompt-aware sequence that scrolls through *real* source names from the knowledge base, one at a time, like the bot is actually scanning.

## Scope
- **Edexcel Economics only** (Free + Deluxe). All other bots keep current behaviour.
- Pure frontend change. No edits to `rag-chat` edge function. No DB migrations.
- Exam-season safe: zero risk to answer generation pipeline.

## What the user will see

Right after pressing send, instead of the same 4 lines every time, they'll see something like (for prompt *"explain the multiplier effect"*):

```text
Searching knowledge base...
  ✓ Edexcel Economics Specification
  ↻ Multiplier — Past Paper Mark Scheme
  ↻ Circular Flow of Income — Past Paper
  ↻ Aggregate Demand diagram
  ↻ Macroeconomic Objectives — Section A
```

Items appear **one at a time, ~350ms apart**, with a fade+slide-in. The icon animates from a spinner to a check as the next one arrives. When real `sources_searched` data streams back from the server, it swaps to the existing "Found:" list.

## How matching works

1. **Source pool** built once per session (cached in component state, refreshed on `productId` change):
   - Distinct `metadata.topic` + `content_type` from `document_chunks` for the Edexcel Economics product
   - Diagram titles from `trainer_projects.diagram_library`
   - Always include a generic "[Subject] Specification" anchor as the first item
2. **Keyword scoring** of the user's prompt against each source:
   - Tokenise prompt (lowercase, strip ~80 stop words — reuse Past Paper Finder list)
   - Score = sum of token matches in topic name (2× weight on exact word match)
   - Tie-breaker: prefer mix of content types (1 spec, 1 past paper, 1 diagram, 1 mark scheme)
3. **Top 4–5 results** become the displayed sequence. If nothing matches, fall back to the **4 most-common topics** (per user choice).

## Animation

- Sequential reveal, **350ms stagger**
- Each row: spinner → after 400ms swap to faint check, next row spawns
- Reuse existing `SearchingSourceItem` component visuals (just feed dynamic props)
- Once `setIsSearching(false)` fires (server returned), current sequence stops and "Generating response..." block takes over as today

## Files

**Edited:**
- `src/components/RAGChat.tsx`
  - Add `useReactiveThinking(prompt, productSlug)` hook call right before send
  - Replace the 4 hardcoded `<SearchingSourceItem>` rows (lines 1402–1405) with `{thinkingItems.map(...)}`
  - Gate the new behaviour: `productSlug === 'edexcel-economics'` (existing slug)

**Created:**
- `src/hooks/useReactiveThinking.ts` — fetches & caches the source pool per product, exposes `getThinkingSequence(prompt)`
- `src/lib/thinkingMatcher.ts` — pure tokenise + score function (easy to unit test, reusable)

## Technical details

- **Source pool query** (one-time per product): `select metadata->>'topic' as topic, metadata->>'content_type' as type from document_chunks where product_id = ? and metadata->>'topic' is not null` — cached in module-level Map keyed by productId so navigating between chats reuses it
- **Diagrams**: read from existing `trainerProject.diagram_library` already loaded in RAGChat (no extra fetch)
- **Display formatting**: reuse existing `formatSourceName()` helper (lines around 1418) for consistency with the post-search list
- **Dedup**: drop entries whose normalised topic equals another higher-scoring one (e.g. "Section A" vs "SECTION A")
- **Stop words & 2× boost**: mirror config from `mem://features/past-paper-finder-v4-migration-specs`

## Out of scope
- Server-side streaming of "scanning" events
- Other bots
- Persisting which sources were shown
- Changing the "Generating response..." stage
