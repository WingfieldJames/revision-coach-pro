## Root cause

The Essay Marker modal is rendered **inside** the sticky toolbar `<div>`, which has `backdrop-blur-sm`. CSS filter/backdrop-filter creates a new containing block, so `position: fixed` is anchored to the toolbar's box (not the viewport). That's why:

- The modal sits at the top of the screen (toolbar height area), not centered in the viewport.
- The grey overlay only covers the toolbar strip, not the whole page.

## Fix — `src/components/ChatbotToolbar.tsx`

Render the Essay Marker modal through a **React portal to `document.body`**, so it escapes the toolbar's containing block.

1. Import `createPortal` from `react-dom`.
2. Wrap the existing essay-marker modal JSX block in `createPortal(<...>, document.body)`.
3. Keep all existing classes (`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 px-4`) — they will now correctly cover the full viewport and centre the modal.
4. No changes to size, layout, content, or trigger button behaviour.

That's the only change needed — the modal will then center vertically/horizontally and the grey backdrop will cover the entire screen, identical to the Revision Timetable.