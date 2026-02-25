

## Plan: Fix Progress Tracking and Re-Deploy Button Behavior

### Problem 1: Progress sidebar shows green ticks without explicit Submit

Currently, when loading uploads from the database, any year where all files have `processing_status === "done"` is auto-added to `submittedYears` (lines 346-352 in BuildPage.tsx). This means the Progress sidebar shows a green tick even though the trainer never explicitly pressed "Submit" for that year.

The `PastPaperYearCard` also has the same issue -- `initialSubmitted` is set to `true` when all uploads are done (line 1268), causing the card to render in "submitted" state with no Submit button visible.

**Fix:**
- Stop auto-populating `submittedYears` based on processing status alone
- Track explicit year submissions in the database by adding a `submitted_years` JSON column to `trainer_projects`, or by storing it in the existing `custom_sections`-style pattern
- Since we can't add DB columns directly, we'll store submitted years as a JSON array in a new field on `trainer_projects`. However, since we can't alter the table schema here, we can repurpose the existing project data or store it alongside the project load logic
- Simplest approach: persist `submittedYears` as part of the trainer_projects update (we can store it in the existing JSON-capable columns or use local state that only marks complete on explicit Submit)
- On load, only restore years that were explicitly submitted (not just "all files done")

For the `PastPaperYearCard`, change `initialSubmitted` to only be true when the year is in the persisted submitted set, not when all files are processed.

### Problem 2: Re-Deploy button should appear when files are added/edited/deleted

The current code already sets `hasChangesSinceDeploy = true` when files are added (line 484) or deleted (line 517) on a deployed project. However, there are edge cases:

- The `PastPaperYearCard` submit/edit actions don't trigger `setHasChangesSinceDeploy(true)` -- submitting or un-submitting a year on a deployed project should also flag changes
- The re-deploy button text and state are correct, but we should ensure it's always enabled for deployed projects when any file-level change occurs

**Fix:**
- Add `setHasChangesSinceDeploy(true)` to the `onSubmitYear` and `onEditYear` callbacks
- Ensure the deploy button label clearly shows "Re-Deploy Changes" whenever there are pending changes

### Files to modify

1. **`src/pages/BuildPage.tsx`**:
   - Remove auto-population of `submittedYears` from the upload loading effect (lines 346-352). Instead, only populate from a persisted source
   - Change `initialSubmitted` prop on `PastPaperYearCard` (line 1268) to use the persisted submitted years set, not processing status
   - Add `setHasChangesSinceDeploy(true)` to `onSubmitYear` and `onEditYear` callbacks when `projectStatus === "deployed"`
   - Store submitted years in `trainer_projects` via a new auto-save mechanism (using an unused JSON column or piggybacking on an existing one)

### Technical Detail: Persisting Submitted Years

Since we need submitted years to survive page refreshes, we have two options:
- **Option A**: Store in a new DB column (requires migration)
- **Option B**: Store inside the existing `custom_sections` or `staged_specifications` JSON -- not ideal as it pollutes data

Best approach: We'll need a small migration to add a `submitted_paper_years` jsonb column to `trainer_projects`. Alternatively, we can encode it as part of the existing project update pattern without a new column by storing it as a convention within an existing JSON field.

Given the constraint, the cleanest path is to persist `submittedYears` using a Supabase migration for a new column, then load/save it alongside other project data. If a migration is not feasible right now, we can use localStorage as a fallback keyed by project ID (less robust but no schema change needed).

I will use localStorage keyed by project ID as an interim solution, and persist to DB when the trainer deploys.

