
## GCSE Subject Order Change

### Objective
Reorder the GCSE subject cards on the GCSE selection page to the new sequence: **Geography, Biology, Chemistry, Physics, Maths** (instead of the current order).

### Current State
The GCSE subject list is hardcoded in `src/pages/GCSESubjectSelectionPage.tsx` with the existing order: Maths, Biology, Chemistry, Physics, Geography, etc.

### Implementation Plan

1. **Edit `src/pages/GCSESubjectSelectionPage.tsx`** — Reorder the `GCSE_SUBJECTS` array elements so they appear in the requested sequence:
   - Geography (first)
   - Biology (second)
   - Chemistry (third)
   - Physics (fourth)
   - Mathematics (fifth)

2. **Verify responsive layout** — Confirm the 2-column grid layout still renders correctly on mobile after reordering.

3. **Test navigation** — Ensure clicking each subject card correctly routes to the corresponding GCSE subject chatbot.

### Files Modified
- `src/pages/GCSESubjectSelectionPage.tsx` (only)

### No other changes required
- No database updates needed (hardcoded UI array)
- No routing changes needed (existing paths remain)
- No CSS changes required (grid layout unchanged)
