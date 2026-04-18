

## Diagnosis

The Edexcel Maths spec has **5 non-spec-point overview chunks** that lack metadata `topic`/`spec_id` AND lack a numeric code (`X.Y:`) in their bracket header, so my previous fix can't recognise or filter them:

1. `Qualification Overview` — body is JSON `{ "overall_structure": ... }`
2. `Assessment Information` — body is JSON `{ "first_assessment": ... }`
3. `Overarching Theme: theme 1 mathematical argument language and proof` — `Code: OT1`
4. `Overarching Theme: theme 2 mathematical problem solving` — `Code: OT2`
5. `Overarching Theme: theme 3 mathematical modelling` — `Code: OT3`

Because the header-regex requires `X.Y:`, these fall through to the "first 80 chars of content" fallback → the JSON braces / `Code: OT1 GENERAL REQUIREMENT...` end up as the dropdown name. The keyword filter then can't catch them either, because the words `Qualification Overview` / `Assessment Information` are no longer in the parsed `rawName`.

This affects **only Edexcel Maths** — other subjects don't have these JSON-bodied overview chunks. **No re-upload needed** — the data underneath is fine, it's purely a UI parsing issue. The 80+ proper spec points (1.1, 2.4, 7.1, etc.) load correctly.

## Fix (single file: `src/components/DynamicRevisionGuide.tsx`)

Tighten the spec-load loop in two ways:

1. **Always parse the bracket header first** to get the `name` text after the dash, regardless of whether it has a numeric code. Use a relaxed regex: `^\[[^\]]*?-\s*(.+?)\]` then secondarily extract `X.Y:` if present. This means `Qualification Overview`, `Assessment Information`, and `Overarching Theme: ...` become the parsed name (not the JSON body).

2. **Expand the skip-list** to also drop:
   - `Overarching Theme` (any of OT1/OT2/OT3)
   - Anything where the parsed body still starts with `{` (defensive — JSON should never appear as a spec point name)
   - Anything with no numeric code AND name matching `/Qualification|Assessment|Overarching|Overview|Aims/i`

Net effect: dropdown shows only the 80+ real numbered spec points (1.1 Proof, 2.4 Algebra, 7.1 Differentiation, etc.) — the 5 overview chunks vanish from the picker. They remain in the DB so RAG chat can still reference them if needed.

## Out of scope

- Re-uploading the spec (unnecessary — data is correct, only the dropdown parser is wrong)
- Other subjects (filter changes are scoped via the existing logic and are safe additions — won't surface new chunks anywhere else)
- Edge function (`generate-revision-guide` is already sanitised from the prior fix)

## Files touched

- `src/components/DynamicRevisionGuide.tsx` — tighten header parsing + expand overview skip-list

