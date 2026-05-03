## Why the Build page is empty

Trainer accounts can sign in fine (the `user_roles` lookup works, so `hasAccess` becomes true), but the next query `supabase.from('trainer_projects').select('*')` silently returns zero rows.

Inspecting Postgres ACLs:

```text
trainer_projects → anon=awdDxtm, authenticated=awdDxtm    ← no 'r' (SELECT)
products / user_roles / trainer_uploads / etc → arwdDxtm  ← has 'r'
```

So the table-level `SELECT` privilege on `public.trainer_projects` was revoked from `anon` and `authenticated` (likely by a prior security action — none of our migrations did it). Because Postgres checks table-level grants *before* RLS, the trainer policies never get a chance to allow the read. Result: `loadProjects()` resolves to `[]`, the cascading Qualification/Subject/Board selectors render empty, and the page looks "wiped". The 40 rows in `trainer_projects` are still intact.

This also affects the trainer-side queries on `trainer_projects` everywhere (deploy flow, save flow, etc.).

## Fix

A single tiny migration:

```sql
GRANT SELECT, INSERT, UPDATE ON public.trainer_projects TO authenticated;
GRANT SELECT ON public.trainer_projects TO anon;
```

RLS already restricts what each role can actually see/modify:
- `anon` / non-trainer: only rows where `status='deployed'` (existing public policy, column-restricted).
- trainers/admins: full read + write via existing `has_role(...)` policies.

So this only restores the privilege that should have been there; it does not widen data exposure.

## Verification after migration

1. Re-check ACLs: `relacl` for `trainer_projects` should show `arwdDxtm` for both roles.
2. Reload `/build` as a trainer — Qualification / Subject / Board dropdowns repopulate, and the previously selected project rehydrates from `localStorage`.
3. Confirm public chat pages still load deployed trainer assets unchanged.

No frontend code changes required.