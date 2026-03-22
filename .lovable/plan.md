

# Fix Diagram Integration: Use Build Diagrams + Embed in Response

## Problem

Two issues:
1. **AI draws its own diagrams** (ASCII art) instead of only referencing the real image from Build
2. **Build diagrams only appear at the bottom** of the response, not embedded within the explanation
3. **Edge function uses hardcoded diagram arrays** instead of fetching from `trainer_projects.diagram_library` (Build portal)

## Changes

### 1. Edge Function: Fetch Build diagrams + stronger AI instructions (`rag-chat/index.ts`)

**Fetch custom diagrams from Build:**
- After finding the product_id, query `trainer_projects.diagram_library` for that product
- Merge Build diagrams with the hardcoded fallback arrays (Build takes priority)
- Pass merged set to `findRelevantDiagram()`

**Stronger diagram prompt (line ~948):**
Replace the current `--- DIAGRAM AVAILABLE ---` block with explicit instructions:
```
--- DIAGRAM AVAILABLE ---
A diagram titled "{title}" will be displayed as an image below your response.
IMPORTANT: Do NOT draw, create, or describe your own version of this diagram using text, ASCII art, or markdown.
Simply reference it naturally: e.g. "As shown in the diagram below..." or "The {title} diagram illustrates..."
The image will appear automatically — you do not need to reproduce it.
```

### 2. Client: Move diagram inline within response (`RAGChat.tsx`)

Currently the diagram renders after the entire message (line 722). Instead:
- When the AI response contains a natural reference point (e.g., after a paragraph mentioning the diagram), insert the diagram image at that point
- Simpler approach: render the diagram **immediately after the first paragraph** of the AI response rather than at the very end, making it feel embedded in the explanation
- This is done by splitting `displayContent` at the first double-newline and injecting the diagram component between the two halves

### 3. Edge Function: Also add general "no ASCII diagrams" rule

Add to the essay marking / general instructions section:
```
IMPORTANT: Never create ASCII art, text-based diagrams, or attempt to draw diagrams using characters.
If no diagram image is available from the system, simply describe what the diagram would show in words.
```

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/rag-chat/index.ts` | Fetch Build diagrams, merge with fallbacks, stronger "don't draw" prompt |
| `src/components/RAGChat.tsx` | Render diagram inline after first paragraph instead of at bottom |

