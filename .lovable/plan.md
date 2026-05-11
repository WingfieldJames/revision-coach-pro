## Goal
Update the Essay Marker tool's internal popup header (not the toolbar button).

## Changes — `src/components/EssayMarkerTool.tsx` (lines 283–294)

1. **Icon**: Replace the gradient-purple `PenLine` icon block with the A* logo on a transparent background — no colored container behind it.
   - Generate a transparent-background version of the existing A* icon → `src/assets/a-star-icon-transparent.png` (using imagegen, prompted to match the existing 3D gradient A* badge).
   - Import it and render as a plain `<img className="w-10 h-10 object-contain" />` — no `bg-gradient-brand` wrapper.
   - Remove the now-unused `PenLine` import from the header (still used later in the "Mark Essay" button at line 437, so keep the import).

2. **Title**: Change `{toolLabel}` → `Mark my essay` (hardcoded, overriding the prop for the in-popup heading).

3. **Subtitle**: Change `Upload a photo or paste your {fixedMark ? '${fixedMark}-marker' : 'essay'}` → `Get examiner-grade feedback in seconds`.

## Out of scope
- Toolbar button icon/label (user explicitly said "not the button image").
- Any other Essay Marker behavior or styling.
