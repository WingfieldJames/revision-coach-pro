

## Plan: Fix Past Paper Finder for All Dynamic Subjects

### Problems Identified

1. **Mark schemes appearing in results**: The `search_only` mode in `rag-chat` includes `past_paper_ms` in the allowed content types, so pure mark scheme chunks (like the 76 AQA Geo 2019 ones) show up as student-facing results with content like "Mark Scheme Q01.3: ..."
2. **Wrong years**: The 2019 year issue is specific to AQA Geo's `past_paper_ms` chunks — they were ingested as standalone mark schemes, never merged. This makes it look like everything is from 2019.
3. **Wrong question numbers**: The `past_paper_ms` chunks use a different format (e.g., `01.3` instead of `1(c)`), and the frontend `parseChunkDisplay` function doesn't normalize these.
4. **Figures not included**: Questions reference figures (e.g., "Using Figure 14") but the figure descriptions are only in the `Context:` field of the chunk content. No figure images are linked. The user wants figure chunks from training data to be discoverable/included.

### Solution

#### 1. Edge Function: Exclude mark schemes from search results (`rag-chat/index.ts`)

In the `search_only` block (~line 407), remove `past_paper_ms` and `mark_scheme` from `PAPER_CONTENT_TYPES`:

```typescript
const PAPER_CONTENT_TYPES = [
  'paper_1', 'paper_2', 'paper_3',
  'past_paper', 'past_paper_qp', 'combined',
];
```

This ensures only question-paper-side chunks appear in the Past Paper Finder results. Mark schemes will never surface as standalone results.

#### 2. Frontend: Better metadata parsing in `DynamicPastPaperFinder.tsx`

Update `parseChunkDisplay` to:
- **Skip chunks whose content starts with "Mark Scheme"** as a safety net
- **Extract year properly** from metadata, falling back to content parsing
- **Normalize question numbers** (convert `01.3` to `1(c)` format or just display as-is but cleaned up)
- **Extract figure references** from the content/context and display them prominently
- **Strip mark scheme text** from combined chunks that contain both QP and MS text — only show the question portion

Specifically:
- Add a `content.startsWith('Mark Scheme')` filter in the results display
- Parse `Context: Figure X: description` into a proper extract display
- Clean question number format: strip leading zeros, display sub-parts naturally

#### 3. Frontend: Include figure chunks in search results

Update the `paperTypes` filter in `handleSearch` (~line 157) to also match chunks that have figure-related content. This means:
- When processing results, check if `content` or `metadata.topic` contains "Figure" references
- Display figure context prominently as italicized extracts (already partially working via the `extract` variable)

For figure titles from training data: since figures are described inline within question chunks (in the `Context:` field), they're already part of the search results. The fix is to parse and display the `Context:` field more prominently rather than stripping it. Update `parseChunkDisplay` to preserve figure descriptions.

#### 4. All subjects benefit

These changes are in the shared `DynamicPastPaperFinder.tsx` component and the `rag-chat` edge function — so every dynamic subject (AQA Geo, OCR Physics, etc.) gets the fixes automatically.

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/rag-chat/index.ts` | Remove `past_paper_ms` and `mark_scheme` from `PAPER_CONTENT_TYPES` in search_only mode |
| `src/components/DynamicPastPaperFinder.tsx` | Filter out mark scheme chunks client-side, improve question number display, better figure/context extraction |

### Technical Notes

- The 76 AQA Geo `past_paper_ms` chunks with year 2019 are legacy data that were ingested as standalone mark schemes. They should not appear in student-facing search results.
- The `past_paper` chunks (years 2018, 2020-2024) have proper metadata: correct year, question_number, paper_number, marks, and topic. Some include mark scheme text inline (after "Mark Scheme:") which should be stripped from display.
- No database migration needed — this is purely logic/display fixes.

