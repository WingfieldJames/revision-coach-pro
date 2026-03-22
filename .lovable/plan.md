

# Revision Guide: Full Build Integration + Diagram Support + Stability

## Current State

The revision guide is **mostly wired up** to the Build portal already — it fetches spec points and training data from `document_chunks`, and loads diagrams from `trainer_projects.diagram_library`. However, there are gaps:

1. **Context overflow** — Same bug as rag-chat: the edge function concatenates up to 170 chunks with no character cap, causing gateway timeouts
2. **CORS headers missing** — Same missing `x-supabase-client-*` headers
3. **Diagram matching is weak** — The client-side keyword matching only checks diagram `keywords` array, but most diagrams in the Build portal don't have keywords set. Title words should also be used for matching
4. **Diagram context sent to AI is too sparse** — Only sends `"- Title (available as diagram image)"` — the AI doesn't know what the diagram actually shows, so it can't intelligently decide when to reference it
5. **No context cap** — Training context can exceed 100K chars, causing the same crashes as rag-chat

## Plan

### 1. Edge Function: Add context cap + fix CORS (`generate-revision-guide/index.ts`)
- Add `MAX_CONTEXT_CHARS = 40000` constant
- Cap training context concatenation to stay within limit
- Update CORS headers to include `x-supabase-client-*` headers

### 2. Edge Function: Fetch diagrams server-side (`generate-revision-guide/index.ts`)
- When `diagrams` option is enabled and client sends diagram_context, use it
- Additionally, fetch `trainer_projects.diagram_library` server-side as a fallback so the AI always has access to available diagrams
- Include diagram titles AND any keywords/descriptions in the context so the AI can make informed decisions about which diagrams to reference

### 3. Client: Improve diagram keyword matching (`DynamicRevisionGuide.tsx`)
- When matching diagrams to a spec point, also split diagram titles into words and use those as match terms (not just the `keywords` array)
- This ensures diagrams uploaded in Build without explicit keywords still get matched

### 4. Client: Send richer diagram context to edge function (`DynamicRevisionGuide.tsx`)
- Instead of just `"- Title (available as diagram image)"`, include the diagram's keywords so the AI knows what the diagram covers

## Technical Details

**Context cap logic (edge function):**
```text
After filtering relevant chunks, iterate and concatenate
Stop when total chars > MAX_CONTEXT_CHARS (40,000)
Prioritize exam_technique + specification chunks first
```

**Diagram matching improvement (client):**
```text
Current: only match on d.keywords array
Fixed: also split d.title into words and use as match terms
Example: diagram "Supply and Demand Curve" matches spec about "demand"
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/generate-revision-guide/index.ts` | Context cap, CORS fix, server-side diagram fallback |
| `src/components/DynamicRevisionGuide.tsx` | Better diagram matching, richer diagram context |

