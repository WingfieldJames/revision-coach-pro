

## Root Cause: Edexcel Economics Past Paper Finder Uses Hardcoded Data, Not the Database

### The Problem

Edexcel Economics is a **legacy subject** with its own dedicated page (`FreeVersionPage.tsx` / `PremiumVersionPage.tsx`). These pages do NOT pass `customPastPaperContent` in their shared props, so the toolbar/sidebar renders the **legacy `PastPaperFinderTool`** component.

The legacy `PastPaperFinderTool` reads from **hardcoded TypeScript files** (`src/data/edexcelPastPapers.ts`) — it has zero connection to the database. The "Refresh Index" button in the Build portal re-embeds chunks in `document_chunks`, but the legacy component never queries that table.

### The Two Systems

```text
┌─────────────────────────────────────┐
│  LEGACY subjects (Edexcel Econ,     │
│  AQA Econ, OCR CS, etc.)           │
│                                     │
│  FreeVersionPage / PremiumVersionPage│
│       ↓                             │
│  PastPaperFinderTool                │
│       ↓                             │
│  src/data/edexcelPastPapers.ts      │  ← HARDCODED arrays
│  (EDEXCEL_SPEC_POINTS,              │
│   EDEXCEL_PAST_QUESTIONS)           │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  DYNAMIC subjects (OCR Economics,   │
│  any new Build-deployed subject)    │
│                                     │
│  DynamicFreePage / DynamicPremiumPage│
│       ↓                             │
│  customPastPaperContent =           │
│    <DynamicPastPaperFinder />       │
│       ↓                             │
│  rag-chat edge function             │  ← Queries document_chunks DB
│  (search_only: true)                │
└─────────────────────────────────────┘
```

### Why "Refresh Index" Does Nothing for Edexcel Economics

1. You upload past papers in the Build portal → they get processed into `document_chunks` with `product_id = 6dc19d53-...`
2. You click "Refresh Index" → it re-embeds those chunks (works fine)
3. Student opens `/free-version` → `FreeVersionPage` renders `PastPaperFinderTool` with `board="edexcel"`
4. `PastPaperFinderTool` reads from `EDEXCEL_PAST_QUESTIONS` in `src/data/edexcelPastPapers.ts` — **never touches the database**

### The Fix (for all legacy subjects)

For each legacy subject page that has uploaded past papers via Build, pass `customPastPaperContent` with `<DynamicPastPaperFinder />` instead of relying on the hardcoded `PastPaperFinderTool`. This is the same pattern already used by `DynamicFreePage`.

Specifically for Edexcel Economics, add to `FreeVersionPage.tsx` and `PremiumVersionPage.tsx`:

```tsx
customPastPaperContent: <DynamicPastPaperFinder 
  productId={EDEXCEL_PRODUCT_ID} 
  subjectName="Edexcel Economics" 
  tier="deluxe" 
/>,
```

The same change would apply to every other legacy subject (AQA Economics, OCR CS, OCR Physics, AQA Psychology, Edexcel Maths) once their Build-uploaded papers should replace the hardcoded data.

### Summary

- **Error**: Legacy pages use `PastPaperFinderTool` which reads hardcoded `.ts` files, completely disconnected from `document_chunks`
- **Fix pattern**: Pass `customPastPaperContent={<DynamicPastPaperFinder />}` in shared props for any legacy subject that now has Build-uploaded papers
- **No edge function or DB changes needed** — just wiring the correct component

