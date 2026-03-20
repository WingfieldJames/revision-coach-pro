

## Problem

The database has many duplicate `trainer_projects` entries (e.g., 5 "AQA Physics", 7 "Edexcel Physics"). The deduplication logic added in the recent build changes keeps the **earliest created** project, but that's usually an empty draft with no `product_id`. The deployed project with actual data gets filtered out. This means:

1. Users see a blank project instead of their real one
2. Saves go to the wrong (empty) project
3. Everything appears broken

Additionally, the `TrainerProject` interface is missing `qualification_type`, forcing `(p as any)` casts everywhere.

## Solution (single file: `src/pages/BuildPage.tsx`)

### 1. Fix deduplication to keep the best project, not the first

Change the dedup logic (~lines 271-276) to prefer:
- **Deployed** projects over drafts
- Projects **with a product_id** over those without
- If tied, keep the most recently updated one

```
For each group of duplicates (same qual+board+subject):
  Pick the one that is deployed, or has a product_id, or was updated most recently
```

### 2. Add `qualification_type` to the `TrainerProject` interface

Add `qualification_type: string;` to the interface (line 48 area) so all the `(p as any).qualification_type` casts become proper typed access.

### 3. Clean up all `(p as any).qualification_type` references

Replace every `(p as any).qualification_type || 'A Level'` with `p.qualification_type` since the DB column has a default of `'A Level'` and is non-nullable — the value will always be present.

## Why this fixes the save issue

Currently: dedup keeps project `80675002` (AQA Biology, no product_id, empty draft) and drops `5716aa05` (AQA Biology, has product_id, has data). User sees empty form, saves to wrong project. With the fix, the deployed/data-having project wins, so edits and saves target the correct record.

