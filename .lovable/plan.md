

## Fix: Essay Marker Submit Button Disappearing on Free Tier

### Root Cause
The `ChatbotToolbar` wraps tool content in `<ScrollArea className="max-h-[70vh]">`. When a photo is attached in image mode, the EssayMarkerTool's total content height exceeds this limit — but only on free tier, because the "X free uses remaining" indicator adds ~36px that pushes the action buttons below the scroll viewport. The ScrollArea doesn't auto-scroll to show the newly hidden buttons.

On deluxe, the usage indicator isn't rendered, so the content fits within 70vh. That's why it "works for deluxe".

### Fix (2 changes, same file)

**File: `src/components/EssayMarkerTool.tsx`**

1. Add a ref to the action buttons div and auto-scroll it into view whenever `attachedFiles` changes:

```typescript
const actionRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  if (attachedFiles.length > 0 && actionRef.current) {
    actionRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}, [attachedFiles]);
```

2. Attach the ref to the action buttons container:
```tsx
<div ref={actionRef} className="flex gap-2">
```

This ensures that when a user attaches a photo, the Mark Essay button scrolls into view automatically — regardless of tier, viewport size, or how many elements are above it.

### Why Not Just Remove the Usage Indicator?
The indicator is useful UX ("2 free uses remaining"). The real fix is ensuring scroll behavior works correctly with dynamic content, not removing informational elements.

### Scope
- Single file change: `src/components/EssayMarkerTool.tsx`
- No design changes — identical look for free and deluxe
- Works for all subjects since they all use the same component

