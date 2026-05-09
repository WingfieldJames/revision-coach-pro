## Goal
Make the `AnswerFooter` (Edexcel Econ) span the full width of the assistant chat bubble, keeping a small inset so a thin strip of the grey bubble shows as a border around it.

## Current layout
The assistant bubble (`RAGChat.tsx` ~line 1157) is `flex gap-3 p-4 rounded-xl bg-muted`. Inside, the avatar (32px) sits left and the message content lives in a `flex-1` column. The `AnswerFooter` renders inside that column, so it's already inset by avatar(32) + gap(12) + bubble padding(16) on the left and 16px on the right/bottom — making it look like a small "add-on" card.

## Change
In `src/components/AnswerFooter.tsx`, on the outer wrapper (line 131), use negative margins to break out of the content column so the card hugs the bubble edges, leaving only a small visible grey strip as the "border":

- Left: `-ml-[44px]` (offsets avatar 32px + gap 12px) so it aligns with the bubble's left padding edge, then a small inset.
- Right/bottom: extend to bubble edge with a small inset.
- Net result: roughly `mt-4 -ml-[40px] -mr-1 -mb-1` (tweakable) — gives ~4px grey strip on right/bottom and aligns left with the bubble's inner padding while remaining visually "full width".

Keep the existing rounded corners, white/dark background, and border so the footer still reads as its own surface but feels like an integrated section, not a small chip.

No changes to logic, props, or other components.

## Files
- `src/components/AnswerFooter.tsx` — adjust outer div className only.
