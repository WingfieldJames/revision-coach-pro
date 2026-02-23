

# Fix Specification Upload Status and Single-File Behavior

## Problem
1. The Specification row in the Progress sidebar is always orange/empty because it checks `trainer_uploads` for a `section_type === "specification"` entry, but the `SpecificationUploader` component uses a completely different flow (the `parse-specification` edge function) and never writes to `trainer_uploads`.
2. The uploader currently allows re-uploading endlessly. Since there's only ever one specification per subject, it should show a clear green "done" state once parsed, and not encourage further uploads.

## Solution

### 1. Add status callback to SpecificationUploader
- Add an `onStatusChange` prop to `SpecificationUploader` so it can report its state (`idle`, `processing`, `success`, `error`) back to the parent `BuildPage`.
- Also add an `initialComplete` prop so the component can start in a "done" state if the spec has already been loaded (e.g., from checking `document_chunks` in the DB).

### 2. Update BuildPage to track spec status
- In `BuildPage`, check the database on load (query `document_chunks` or `trainer_uploads` for existing spec data for this project/product) to determine if a specification has already been ingested.
- Pass the result to `SpecificationUploader` and use the callback to update the Progress sidebar row from `empty` to `in_progress` to `complete`.

### 3. Change SpecificationUploader to single-file "done" mode
- When status is `success` (or the spec was already loaded), show a green card with a checkmark and the message like "Specification uploaded" with the filename.
- Remove the prominent re-upload area. Instead, offer only a small "Replace" text button for edge cases.
- The progress sidebar row will show green when complete.

## Technical Details

**Files to modify:**

1. **`src/components/SpecificationUploader.tsx`**
   - Add props: `onStatusChange?: (status: "idle" | "processing" | "success" | "error") => void` and `initialComplete?: boolean`
   - Call `onStatusChange` at each state transition
   - If `initialComplete` is true, render the green "done" state immediately
   - In success state: show a compact green confirmation with just the filename and a small "Replace" button (no large upload zone)

2. **`src/pages/BuildPage.tsx`**
   - Add a `specStatus` state variable
   - On project load, check if specification data already exists (query `document_chunks` where `product_id` matches and `content_type = 'specification'`, or check `trainer_uploads` for a completed spec entry)
   - Pass `onStatusChange` and `initialComplete` to `<SpecificationUploader />`
   - Update the Progress sidebar's Specification row to use `specStatus` instead of the current `getUploadForSection("specification")` logic

