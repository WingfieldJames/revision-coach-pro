
## Restore "My AI" and "Grade Boundaries" to top toolbar on wide screens

### Goal
On wide desktop screens, "My AI" and "Grade Boundaries" should appear in the top `ChatbotToolbar` (as they were originally). On narrower screens, they remain in the `ChatbotSidebar` under "Features" (current behavior).

### Breakpoint
Use Tailwind's `lg` breakpoint (≥1024px) as the threshold for "full width wide". This keeps tablets/small laptops using the sidebar version and only restores the toolbar buttons on true desktop widths.

### Changes

**1. `src/components/ChatbotToolbar.tsx`**
- Re-add `my-ai` and `grade-boundaries` entries to the `toolItems` array (they already have `renderToolContent` cases intact — no popover/render logic to restore).
- Both entries gated by `show: showMyAI` and `show: showGradeBoundaries` respectively, so pages that don't pass those props are unaffected.
- Wrap each of these two buttons (only) with a `hidden lg:flex` class so they are hidden below the `lg` breakpoint and the sidebar version takes over.

**2. `src/components/ChatbotSidebar.tsx`**
- Wrap the "My AI" and "Grade Boundaries" buttons inside the Features section with a `lg:hidden` wrapper so they only appear under `lg` width.
- Leave all other sidebar Features (Past Papers, etc.) untouched.
- Keep the existing modal wrappers and lazy-loaded components intact (they only render when their popup state is true, so no overhead on desktop).

### Result
- ≥1024px: My AI + Grade Boundaries appear in the top toolbar exactly as they were before, alongside Diagram Generator / Essay Marker / Past Papers / etc. Sidebar shows Features without these two.
- <1024px: Top toolbar omits them; sidebar Features list shows them (current behavior preserved for mobile/tablet).

### Files modified
- `src/components/ChatbotToolbar.tsx`
- `src/components/ChatbotSidebar.tsx`

### Out of scope
- No changes to per-page props (`FreeVersionPage`, premium pages, etc.) — they already pass `showMyAI` and `showGradeBoundaries`.
- No changes to the underlying `MyAIPreferences` or `GradeBoundariesTool` components.
