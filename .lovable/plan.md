## Add decorative "Predicted mark" preview card to Essay Marker header

The Essay Marker modal (max-w-5xl) leaves a lot of empty white space to the right of the "Mark my essay" title and subtitle. We'll fill it with a stylised preview card matching the supplied mockup, themed to the site's tokens.

### Change

In `src/components/EssayMarkerTool.tsx`, restructure the header block (lines ~286–295) into a two-column layout:

- **Left column:** existing A* icon + "Mark my essay" title + subtitle (unchanged).
- **Right column:** new decorative card, hidden on mobile (`hidden md:block`), shown from `md:` upwards. Purely visual — not interactive, no real data.

### Card design (tokenised, not hardcoded purple)

- Container: `bg-card`, `rounded-xl`, `border border-border`, subtle `shadow-sm`, `p-4`, fixed `w-[280px]`.
- Top row (flex justify-between):
  - Left: caption "Predicted mark" in `text-muted-foreground text-xs`, then big number `19` (`text-3xl font-medium tracking-tight`) with `/25` smaller and muted.
  - Right: pill badge "A* band" using `bg-primary/10 text-primary` (deep blue in light mode via existing `--primary` token), `rounded-full px-3 py-1 text-xs font-medium`.
- Segmented progress bar (5 segments, `h-1.5 rounded-full overflow-hidden flex gap-1`):
  - 3 segments solid `bg-primary`
  - 1 segment `bg-primary/40`
  - 1 segment `bg-muted`
- Bottom grid (2 cols): "KAA 12/15" and "Evaluation 7/10" with muted captions and `text-foreground font-medium` values.

### Theming notes

- No hardcoded `#6D28D9` / `#F5F3FF`. Uses `primary`, `card`, `border`, `muted`, `foreground`, `muted-foreground` tokens so it adopts dark-mode and per-subject primary automatically.
- Font already inherits Inter/DM Sans from app — no overrides needed.
- Decorative only: no props, no state, no click handlers; `aria-hidden="true"` on the card.

### Files

- `src/components/EssayMarkerTool.tsx` — replace the header `<div className="flex items-center gap-3">` block with a `flex items-start justify-between gap-6` wrapper containing the existing header (left) and the new preview card (right, `hidden md:block`).

No other files affected; no logic, data, or routing changes.
