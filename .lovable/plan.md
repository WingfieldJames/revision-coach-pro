## Plan: Rename "biology" → "Biology"

The DB `trainer_projects` table already stores `Biology` (capital B), but the `products` table has 3 rows with lowercase `biology` in the `subject` column. On `/compare`, the A-Level pill renders the raw subject string from `products`, which is why it shows lowercase.

### Backend
Run a Supabase migration updating `products.subject` from `'biology'` → `'Biology'` for all 3 affected rows:
- `aqa-biology` (A-Level)
- `edexcel-biology` (GCSE)
- `edexcel-igcse-biology` (GCSE)

### Frontend
No code change required — `ComparePage.tsx` and `GCSEComparePage.tsx` already lowercase the subject when building slugs (`dp.subject.toLowerCase().replace(/\s+/g, '-')`), so slugs/keys (`biology`) stay unchanged. Only the displayed label updates, which is what we want.

I'll verify after the migration that the `/compare` pill, dropdown, and headings all render "Biology".
