

# Revamped Save & Deploy Workflow for Build Portal

## Overview
Restructure the Build Portal to follow a clear 3-step workflow: **Edit -> Save -> Deploy**. Remove the dangerous "Erase All Training Data" button, add an explicit "Save" button with unsaved-changes tracking, and separate the "Deploy" button so trainers can save progress without going live.

## Changes

### 1. Remove "Erase All Training Data" button
- Delete the entire `AlertDialog` block for erasing training data (lines 1369-1398)
- Remove the `erasing` state variable and `handleEraseTraining` function (lines 185, 692-709)

### 2. Add explicit "Save Changes" button with unsaved-changes tracking
- Add a new state `hasUnsavedChanges` (boolean) that gets set to `true` whenever any content changes: system prompt edits, exam technique edits, trainer bio edits, file uploads/deletions, spec changes, custom section changes, feature toggles, exam dates, essay marker marks
- Add a new state `isSaving` for the save button loading state
- Replace the current auto-save behavior: the existing 2-second auto-save will be replaced by the manual "Save" button. When clicked, it persists all current data to the `trainer_projects` table (system prompt, exam technique, trainer description, custom sections, selected features, exam dates, essay marker marks, submission flags, staged specs)
- After saving, set `hasUnsavedChanges = false` and also set a new flag `hasSavedChangesSinceDeploy = true` (if the project was previously deployed)
- The Save button appears in the header bar (top-right area, next to the status badge):
  - Default state: "Save Changes" (clickable, primary style)
  - After saving: "Changes Saved" (disabled/muted appearance with a checkmark icon)
  - When saving: shows a spinner

### 3. Unsaved changes reminder banner
- When `hasUnsavedChanges` is `true`, show a small sticky banner/toast-style bar at the top of the content area (below the header) with text like: "You have unsaved changes" and a link/button pointing to the Save button
- This disappears once the user clicks Save

### 4. Restructure the Deploy button
- The current "Deploy Subject" / "Re-Deploy Changes" button becomes the "Deploy" button with the following states:
  - **First-time deploy (status = 'draft')**: Button reads "Deploy to Website" and is clickable. On click, it runs the full deploy flow (creates product, deploys chunks, activates on website -- combining the old "Deploy" and "Deploy to Website" into one action for first-time)
  - **Deployed, no new saved changes**: Button reads "Model Deployed" and is disabled/greyed out with a checkmark
  - **Deployed, has saved but undeployed changes**: Button reads "Deploy Changes" and is clickable. On click, it re-deploys the latest saved data
- This replaces both the old "Deploy Subject" button AND the separate "Deploy to Website" button -- they merge into one unified deploy action
- The "Remove from Website" button remains as-is (separate destructive action)

### 5. New state tracking
- `hasUnsavedChanges`: tracks whether the current in-memory state differs from what's saved in the DB
- `hasSavedChangesSinceDeploy`: tracks whether saved DB data differs from what's deployed live (replaces the existing `hasChangesSinceDeploy`)
- When a project loads, both start as `false`
- Any edit sets `hasUnsavedChanges = true`
- Clicking Save sets `hasUnsavedChanges = false` and (if deployed) sets `hasSavedChangesSinceDeploy = true`
- Clicking Deploy sets `hasSavedChangesSinceDeploy = false`

### 6. Remove per-section "Submit" buttons
- The individual "Submit" buttons on System Prompt, Exam Technique, and Meet the Brain sections are removed. Instead, editing any of these sections just marks `hasUnsavedChanges = true`, and all data gets persisted when the global "Save" button is clicked
- The per-section status indicators (green checkmark, orange clock) remain but now reflect whether content has been entered (not whether "Submit" was clicked)

## Technical Details

### Files Modified
- `src/pages/BuildPage.tsx` -- all changes are in this single file

### State Changes Summary
```text
Remove:  erasing, hasChangesSinceDeploy
Add:     hasUnsavedChanges, hasSavedChangesSinceDeploy, isSaving
Keep:    deploying, projectStatus, all content states
```

### Save Handler Logic
```text
handleSave():
  1. Set isSaving = true
  2. Update trainer_projects row with ALL current field values
  3. Persist submission flags based on whether content exists
  4. Set hasUnsavedChanges = false
  5. If projectStatus === 'deployed', set hasSavedChangesSinceDeploy = true
  6. Show toast "Changes saved"
  7. Set isSaving = false
```

### Deploy Handler Logic
```text
handleDeploy():
  1. If hasUnsavedChanges, auto-save first
  2. Call deploy-subject edge function (same as current)
  3. If first deploy (draft), also activate on website
  4. Set hasSavedChangesSinceDeploy = false
  5. Set projectStatus = 'deployed'
```

