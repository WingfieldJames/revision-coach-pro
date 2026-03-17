

## Problem

On full-screen/ultra-wide displays, the hero text drifts toward the center and the iPad mockup loses its right-edge bleed. This happens because the container uses flat responsive padding (`md:px-8 lg:px-12 xl:px-16`) which doesn't scale with viewport width -- on a 2560px screen, 16px padding leaves the text floating in the middle.

## Root Cause

The previous dynamic padding (`calc((100vw - 80rem) / 2 + 2rem)`) was removed because it caused whitespace issues. But without it, the text has no anchor to the left side on wide screens.

## Solution

Re-introduce a dynamic left padding that keeps the text aligned with the site's `max-w-7xl` (80rem = 1280px) grid, but only on the left side. The right side stays at `pr-0` so the mockup bleeds freely.

**Key changes in `src/pages/HomePage.tsx` (line 129):**

1. Replace flat `md:px-8 lg:px-12 xl:px-16 md:pr-0` with a style-based approach that calculates left padding dynamically: `max(2rem, (100vw - 80rem) / 2)` -- this matches where content sits in `max-w-7xl mx-auto` containers. Right padding stays 0.

2. Keep the text container's fixed max-widths (`md:max-w-[500px]` etc.) and `md:flex-shrink-0` so it doesn't expand.

3. Maintain all existing negative margins and max-widths on the mockup container (`-mr-20 xl:-mr-40 2xl:-mr-64`, `max-w-[720px] xl:max-w-[950px] 2xl:max-w-[1200px]`).

**Specific change:** Replace the padding classes on the hero inner div with an inline style for left padding and keep `pr-0` for the right side. Below `md` breakpoint, use standard `px-6 sm:px-8` classes as before.

This ensures:
- Normal viewport (1100px): looks exactly the same as now
- Full-screen/ultra-wide: text stays pinned to the left grid line, mockup continues bleeding right

