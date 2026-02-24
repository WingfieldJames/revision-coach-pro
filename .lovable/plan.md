

## Fix: Infinite Render Loop Causing "Aw Snap" Crashes

### Root Cause

An infinite re-render loop between `BuildPage.tsx` and `SpecificationUploader.tsx`:

1. `BuildPage` renders and passes an **inline arrow function** as `onSpecDataChange`
2. `SpecificationUploader` has a `useEffect` with `onSpecDataChange` in its dependency array
3. Since the function is recreated every render, the effect fires every render
4. The effect calls back into `setStagedSpecData()`, which triggers a `BuildPage` re-render
5. This loops infinitely until the browser runs out of memory and crashes

### Fix (2 changes)

**File 1: `src/pages/BuildPage.tsx`**
- Wrap the `onSpecDataChange` callback in `useCallback` so it has a stable reference across renders
- Dependencies: `[projectLoaded, persistSubmissionState]`

**File 2: `src/components/SpecificationUploader.tsx`**
- Remove `onSpecDataChange` from the `useEffect` dependency array (line 76) to prevent re-firing when the parent re-renders
- This is safe because the effect should only fire when `stagedSpecs` or `state` actually changes, not when the callback reference changes

### Why this only recently started
The `projectLoaded` guard and other recent changes to the auto-save logic likely changed the timing such that the loop now consistently triggers before React can bail out of the re-render cycle.

