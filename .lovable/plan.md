

## Fix Edexcel Politics revision guide spec loading

### Problem
Edexcel Politics has **821 specification chunks** correctly stored in `document_chunks`, but **zero appear** in the Revision Guide's spec search. The Politics chunks were ingested with bare metadata (`{content_type: "specification"}` only — no `topic`, no `spec_id`) and content shaped like:

> `Component 1: UK Politics and Core Political Ideas > UK Politics > 1. Political Participation: democracy and participation, ...`

The parser in `DynamicRevisionGuide.tsx` requires either `metadata.topic`, a numeric prefix like `"3.1.1"`, or a `[bracket header]` in content. Politics has none of these, so every chunk is dropped by the filter `if (!code && !/^\d/.test(rawName))`.

### Fix (single file)

**`src/components/DynamicRevisionGuide.tsx`** — extend the spec-point parser to recognise the `"A > B > N. Title: details"` format used by Politics (and other newer ingests):

1. **New format detector**: when `metadata.topic` is empty AND no bracket header, try parsing `content` itself:
   - Split on `" > "` → use the deepest segment as the spec point name.
   - Match leading `^(\d+)\.\s+(.+?)(?::|$)` in the deepest segment to extract `code` (e.g. `"1"`) and `name` (e.g. `"Political Participation"`).
   - Use the parent segments (e.g. `"Component 1: UK Politics … > UK Politics"`) as the topic context, surfaced in the search dropdown subtitle.

2. **Relax the drop filter**: keep a chunk if it has a non-empty parsed `name` of reasonable length (≥3 chars) and isn't pure JSON, even when there's no numeric `code`. The existing "Qualification Overview / Assessment" skip list stays.

3. **Keyword extraction unchanged** — already derived from `content`, which is rich for Politics.

4. **No backend changes needed**: `generate-revision-guide` already pulls all `content_type='specification'` chunks for the product, so once the client surfaces them in the search list, the AI will receive them as context automatically. The function's keyword-overlap relevance filter (≥2 keyword matches) works on the raw content, which is descriptive.

### Verification after deploy
- Open Edexcel Politics → Revision Guide → search "democracy", "parliament", "constitution", "Supreme Court" → spec points should appear in the dropdown.
- Generate a guide for a Politics spec point → confirm the AI output references the actual Edexcel Politics syllabus content (not generic).

### Files modified
- `src/components/DynamicRevisionGuide.tsx` (parser logic only)

### Out of scope
- Re-ingesting Politics with proper `topic`/`spec_id` metadata (not needed; parser fix handles existing chunks).

