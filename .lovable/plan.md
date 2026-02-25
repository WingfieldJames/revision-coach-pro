

# Fixing Dynamic Subject Features for Trainer-Deployed Products

## Current Problems Identified

### 1. Past Paper Finder - Broken Search Logic
**Problem**: The `DynamicPastPaperFinder` fetches only 50 random chunks with a basic text search (keyword matching). It does NOT:
- Link to the specification at all -- there's no spec point matching
- Use semantic/embedding search (the `rag-chat` call with `search_only: true` is made but the response is completely ignored)
- Filter effectively -- it just grabs 50 chunks and does naive keyword matching

**Fix**: Use the `rag-chat` edge function's embedding search properly (or the `match_documents` RPC) to do semantic search, then display the results. Also load the product's specification points from `document_chunks` (where `content_type = 'specification'`) so users can browse/select spec topics first, similar to how the hardcoded subjects work.

### 2. Revision Guide - Missing Spec Integration
**Problem**: The `DynamicRevisionGuide` sends a free-text topic to the `generate-revision-guide` edge function. The edge function does try to find relevant chunks (spec, exam technique, past papers) but:
- It only fetches 20 chunks with no filtering upfront (line 105: `.limit(20)` with no content_type filter), meaning it might get 20 random chunks and miss all the relevant ones
- No spec point selector -- users type free text instead of selecting from their uploaded specification

**Fix**: Increase the chunk retrieval limit and add content_type filtering in the edge function. On the frontend, load spec points from the database so users can pick from them (like the hardcoded version does).

### 3. Essay Marker - No Custom Mark Options
**Problem**: Dynamic subjects use the default mark options `[5, 8, 10, 12, 15, 25]`. The `DynamicFreePage` and `DynamicPremiumPage` don't pass `essayMarkerCustomMarks` to the Header. There's also no way for trainers to configure this in the Build Portal.

**Fix**: 
- Add an `essay_marker_marks` field to `trainer_projects` (JSONB array) so trainers can configure which mark values are available
- Load this config on the dynamic pages and pass it as `essayMarkerCustomMarks` to the Header
- Add a UI in the Build Portal for trainers to set their mark options

---

## Implementation Plan

### Step 1: Database Migration
Add `essay_marker_marks` column to `trainer_projects`:
```sql
ALTER TABLE trainer_projects 
ADD COLUMN essay_marker_marks jsonb DEFAULT '[]'::jsonb;
```

### Step 2: Fix Past Paper Finder (`DynamicPastPaperFinder.tsx`)
- Load specification points from `document_chunks` (where `metadata->content_type = 'specification'`) on mount
- Show a list of spec topics the user can tap to search, OR allow free-text search
- Actually use the `rag-chat` response (semantic search) instead of ignoring it
- Remove the broken fallback text search

### Step 3: Fix Revision Guide Edge Function (`generate-revision-guide/index.ts`)
- Increase chunk limit from 20 to 50
- Add content_type filtering to prioritise specification and exam_technique chunks
- Run separate targeted queries for spec chunks, exam technique chunks, and paper chunks

### Step 4: Fix Revision Guide Frontend (`DynamicRevisionGuide.tsx`)
- Load spec points from `document_chunks` on mount (like Past Paper Finder)
- Show spec points as selectable options instead of just a free-text input
- Pass the selected spec point's content to the edge function for better context

### Step 5: Add Essay Marker Configuration to Build Portal (`BuildPage.tsx`)
- Add a "Mark Options" input in the features section when essay_marker is selected
- Allow trainers to enter comma-separated mark values (e.g., "3, 4, 6, 15")
- Save to `trainer_projects.essay_marker_marks`

### Step 6: Wire Essay Marker Marks to Dynamic Pages
- In `DynamicFreePage.tsx` and `DynamicPremiumPage.tsx`:
  - Fetch `essay_marker_marks` from `trainer_projects`
  - Pass as `essayMarkerCustomMarks` to the Header component

---

## Summary of Files to Change

| File | Change |
|------|--------|
| Database migration | Add `essay_marker_marks` column |
| `src/components/DynamicPastPaperFinder.tsx` | Rewrite to use semantic search + spec point browsing |
| `src/components/DynamicRevisionGuide.tsx` | Add spec point loading + selection UI |
| `supabase/functions/generate-revision-guide/index.ts` | Improve chunk retrieval with targeted queries |
| `src/pages/DynamicFreePage.tsx` | Load + pass essay marker marks |
| `src/pages/DynamicPremiumPage.tsx` | Load + pass essay marker marks |
| `src/pages/BuildPage.tsx` | Add essay marker mark config UI |

