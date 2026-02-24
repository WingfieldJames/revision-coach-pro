

# Build Portal: Trainer-Friendly Subject Management

## Problem
The current Build Portal has a small dropdown with hardcoded subject options ("AQA Biology", "OCR Maths"). This is rigid -- trainers can't easily add new subjects, and the dropdown format doesn't scale well as more subjects are added.

## Solution
Redesign the Build Portal header to be more intuitive and scalable:

1. **Replace the static dropdown with a sidebar-style subject list** that shows all existing trainer projects fetched from the database, plus a prominent "New Subject" button to create new ones.

2. **"New Subject" flow**: When a trainer clicks "New Subject", a dialog appears with two fields -- a Subject name input and an Exam Board input (e.g., "Biology" + "AQA"). This creates a new `trainer_projects` row in the database, and the trainer is taken straight into it.

3. **Dynamic project list**: Instead of the hardcoded `SUBJECT_OPTIONS` array, the portal loads all `trainer_projects` from the database for the current user. Each project shows its name, board, and deployment status (Draft / Deployed badge).

4. **Better header layout**: The header shows the currently selected subject prominently with a clear status badge, and the subject switcher becomes a proper navigation element.

---

## Technical Details

### File: `src/pages/BuildPage.tsx`

**Remove the hardcoded array:**
```typescript
// DELETE this
const SUBJECT_OPTIONS = [
  { value: "AQA-Biology", label: "AQA Biology", subject: "Biology", board: "AQA" },
  { value: "OCR-Maths", label: "OCR Maths", subject: "Maths", board: "OCR" },
];
```

**Add dynamic project loading:**
- New state: `projects` (array of all `trainer_projects` rows for the user)
- New state: `showNewSubjectDialog` (boolean)
- New state: `newSubjectName` / `newExamBoard` (strings for the creation dialog)
- Load all projects on mount with `supabase.from("trainer_projects").select("*").order("created_at")`
- Replace `selectedSubject` (string matching a hardcoded value) with `selectedProjectId` (UUID) pointing to a real DB row

**Replace the header Select with a proper subject picker:**
- A dropdown that lists all projects from the DB, each showing "{Board} {Subject}" and a small status dot (green for deployed, grey for draft)
- A "Create New Subject" item at the bottom of the dropdown, which opens a Dialog
- The Dialog has two inputs: Subject (text input, e.g. "Biology") and Exam Board (select with common boards: AQA, OCR, Edexcel, CIE, or custom text)

**Creation flow:**
- On submit, insert a new row into `trainer_projects` with the given subject + exam_board + created_by
- Automatically select the new project
- All existing logic (loading uploads, auto-save, deploy) continues to work since it's already keyed on `projectId`

**Remove the project-creation logic from the existing `loadProject` effect:**
- Currently, when no project is found for a subject, it auto-creates one. This will be replaced by explicit creation via the dialog.
- The load effect will simply select the project by ID and populate state.

### Summary of changes
- **1 file modified**: `src/pages/BuildPage.tsx`
  - Remove `SUBJECT_OPTIONS` constant
  - Add project list loading from Supabase
  - Replace header `Select` with a dynamic dropdown + "New Subject" dialog
  - Refactor project loading to work by project ID instead of subject string matching
