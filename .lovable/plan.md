

## Match Dynamic Past Paper Finder to Legacy Design

### Problem
The `DynamicPastPaperFinder` has two design mismatches vs the legacy `PastPaperFinderTool`:

1. **Search UX**: Dynamic shows all spec points immediately on load; legacy shows nothing until user starts typing
2. **Results formatting**: Dynamic shows raw chunk text in plain cards; legacy shows beautifully structured cards with Paper/Year/Section header, marks badge, question number, question text, and italic extract (as in the screenshot)

### Changes

#### 1. Fix search UX in `DynamicPastPaperFinder.tsx`

Match the legacy two-step flow:
- Show nothing when search is empty (remove the "browse all spec points" section)
- As user types, show filtered spec points as clickable suggestions (same style as legacy: BookOpen icon, ChevronRight on hover)
- Clicking a spec point selects it (shown as a highlighted pill with dismiss ✕) but does NOT immediately search
- User clicks "Search Past Papers" button to trigger the search
- Add a hint text at the bottom when no query: `Try: "topic1", "topic2"...`

#### 2. Format results cards to match legacy exactly

Parse the chunk metadata to render structured cards identical to legacy:
```
Paper {paper_number} • June {year} • {topic/section}    [marks badge]
Q{question_number}
{question text}
  | {extract in italic with left border}
```

Specifically:
- Header line: `Paper {metadata.paper_number} • June {metadata.year} • {metadata.topic}` in purple/primary
- Marks badge: `{metadata.total_marks} marks` in a rounded pill (bg-primary/10, text-primary, font-bold)
- Question number: `Q{metadata.question_number}` in bold
- Question text: extract from content (strip "Question X(Y):" prefix)
- Extract: if content contains "Context:" section, show it italic with left border (border-l-2 border-primary/30)

#### 3. Add selected spec point state

Add `selectedSpecPoint` state (like legacy's `selectedSpec`). Clicking a suggestion sets this and populates the search bar. The search button is only enabled when a spec point is selected OR the user has typed a free-text query.

### Files Changed
- `src/components/DynamicPastPaperFinder.tsx` — rewrite UI to match legacy pattern exactly

