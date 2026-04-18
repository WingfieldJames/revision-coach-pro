

## Problem

Two raw JSON blobs are sitting in `document_chunks` for Edexcel Economics (product `6dc19d53...`):

- `ad5de0ed-3b0e-4ec4-bd5b-c3d5afeef22a` — `[2023 Paper 1 QP + MS]` (15,111 chars)
- `15246283-12bd-43e0-850d-e1da1bb827b9` — `[Paper 1 QP + MS 2023]` (15,111 chars)

Both look like text someone pasted via the "Add text" feature in the Build portal — they're not parsed PDFs, they're literal JSON dumps with `"papers":`, `"mark_scheme":`, `"indicative_points"` etc. Because `metadata.content_type = "past_paper"` and they contain Economics keywords, the Past Paper Finder surfaces them on almost every search.

The proper June 2023 Paper 1 QP + MS files are already in the DB, properly chunked (19 chunks each). These two blobs are pure duplicates in a broken format.

## Fix

**1. Delete the two bad chunks via migration** (one-time cleanup):
```sql
DELETE FROM document_chunks
WHERE id IN (
  'ad5de0ed-3b0e-4ec4-bd5b-c3d5afeef22a',
  '15246283-12bd-43e0-850d-e1da1bb827b9'
);
```

**2. Add a defensive filter in `DynamicPastPaperFinder.tsx`** so any future raw-JSON pastes never appear as past-paper results. In the `paperResults` filter (around line 206), reject chunks whose content starts with a JSON brace or contains JSON-schema markers like `"indicative_points"`, `"mark_scheme":`, `"ao_allocation"`. These never appear in real exam questions.

```ts
const looksLikeRawJson = (s: string) => {
  const t = s.trim();
  if (t.startsWith('{') || t.startsWith('[{')) return true;
  if (/"(indicative_points|ao_allocation|levels_grid_summary|evaluation_points)"\s*:/i.test(t)) return true;
  return false;
};
// then in the filter:
if (looksLikeRawJson(content)) return false;
```

This is a Edexcel-Economics-only request, but the filter is generic and protects every subject without affecting legitimate parsed chunks (real questions never contain those JSON keys).

## Out of scope

- Re-parsing the deleted JSON into structured chunks — the proper June 2023 papers are already ingested, so deletion alone is sufficient.
- Touching the build-portal "Add text" UI — fix is downstream so historical bad pastes never leak through.

## Files touched

- `supabase/migrations/<new>.sql` — DELETE the two chunk IDs
- `src/components/DynamicPastPaperFinder.tsx` — add `looksLikeRawJson` filter inside `paperResults`

