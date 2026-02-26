

# Rework Past Paper Submit Flow and Tri-State Progress Indicators

## Overview
Three changes: (1) remove the per-year "Submit" button from past papers -- uploaded files are automatically ready for Save, (2) introduce a three-state color system for section indicators (red = unsaved, orange = saved but not deployed, green = deployed), and (3) update the progress bar summary text and unsaved banner to match.

## 1. Remove "Submit" from Past Paper Year Cards

**File: `src/components/PastPaperYearCard.tsx`**
- Remove the `YearState` type and all submit/edit state machine logic (`state`, `handleSubmit`, `handleEdit`)
- Remove `onSubmitYear` and `onEditYear` props
- Simplify the card: if files exist, show them with an "Add files" button and delete buttons always visible (no locked "submitted" state)
- Keep the delete confirmation dialog for deployed files
- The card border stays neutral (no green border for "submitted" -- green will be controlled by the parent based on deploy state)

**File: `src/pages/BuildPage.tsx`**
- Remove `submittedYears` state, localStorage logic, `onSubmitYear`/`onEditYear` callbacks
- Remove `getYearStatus` function (replaced by new tri-state logic)
- Past paper years with uploads are automatically included in the save payload

## 2. Tri-State Section Indicators

Introduce a new status type with three meaningful states:

```text
"empty"    -> grey circle (no data entered)
"unsaved"  -> RED clock icon (data changed locally, not saved to DB)
"saved"    -> ORANGE clock icon (saved to DB, not yet deployed)
"deployed" -> GREEN check icon (live on website)
```

**How each section's state is determined:**
- Compare current form value against `savedSnapshot` (from last DB save) AND against deployed state (`projectStatus === "deployed"` and whether the section existed at last deploy)
- If current value differs from saved snapshot -> RED (unsaved)
- If current value matches saved snapshot but project has saved-since-deploy changes -> ORANGE (saved, not deployed)
- If section is deployed and unchanged -> GREEN (deployed)
- If empty -> grey circle

**File: `src/pages/BuildPage.tsx`**
- Update `SectionStatus` type to `"empty" | "unsaved" | "saved" | "deployed"`
- Update `StatusIndicator` component:
  - `empty`: grey `Circle`
  - `unsaved`: RED `Clock` icon
  - `saved`: ORANGE `Clock` icon  
  - `deployed`: GREEN `CheckCircle2` icon
- Remove `cycleStatus` (no longer needed -- status is computed, not manually cycled)
- Add a `savedSnapshotParsed` memo that parses `savedSnapshot` JSON for field-level comparison
- Create a helper `getSectionStatus(fieldName, currentValue, savedValue, isDeployed)` that returns the correct status

## 3. Update Unsaved Changes Banner

**File: `src/pages/BuildPage.tsx`**
- Change the banner color from orange to RED:
  - Border: `border-red-500/30`
  - Background: `bg-red-500/10`
  - Icon color: `text-red-500`
  - Text color: `text-red-600 dark:text-red-400`
  - Text: "You have unsaved changes" (stays the same)

## 4. Update Progress Bar and Summary Text

**File: `src/pages/BuildPage.tsx` -- `TrainingProgressBar` component**
- Track three counts: `unsaved` (red), `saved` (orange/ready for deploy), `deployed` (green)
- Show summary lines:
  - If unsaved > 0: `"X sections not saved"` in red text
  - If saved > 0: `"X sections ready for deployment"` in orange text (replaces "X sections in progress")
  - Keep the percentage bar showing deployed sections as green fill
- `ProgressRow` component updated to use new status colors

## Technical Details

### Section status computation logic (pseudo-code):
```
for each section:
  if (content is empty/below threshold) -> "empty"
  else if (current content !== saved snapshot content) -> "unsaved"  
  else if (project is deployed AND no changes since deploy) -> "deployed"
  else -> "saved" (in DB but not deployed yet)
```

### Past paper status:
- A year with uploads is either "unsaved" (new uploads since last save), "saved" (uploads exist and are saved), or "deployed" (project is deployed and year data hasn't changed)

### Files to change:
1. **`src/components/PastPaperYearCard.tsx`** -- simplify by removing submit/edit state machine
2. **`src/pages/BuildPage.tsx`** -- new tri-state logic, banner color, progress bar text, remove submittedYears

