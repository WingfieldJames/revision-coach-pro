

# Fix: White Bar Cutting Off Animated Background Paths

## Problem

The fixed bottom composer in `RAGChat.tsx` (line 901) has `bg-background` which creates an opaque white strip across the entire bottom of the screen, cutting off the purple animated paths in the bottom-right corner. The input pill itself (line 921) also has `bg-background`.

Additionally, `RandomChatbotBackground` randomly shows dotted surface 50% of the time — needs to always show paths only.

## Changes

### 1. Remove dotted background option (`src/components/ui/random-chatbot-background.tsx`)
- Remove the random selection logic
- Always return `<ChatbotFullscreenPaths />`

### 2. Make bottom composer transparent (`src/components/RAGChat.tsx`)
- **Line 901**: Change `bg-background` to `bg-transparent` on the fixed bottom container — the background paths will show through
- **Line 921**: Keep `bg-background` on the input pill itself so the text input remains readable — only the surrounding area becomes transparent
- Add a subtle gradient fade from transparent to background just above the input to keep readability without a hard cutoff: replace `bg-background` with a `bg-gradient-to-t from-background/90 to-transparent` on the outer container

## Files Changed

| File | Change |
|------|--------|
| `src/components/ui/random-chatbot-background.tsx` | Always return paths, remove dotted option |
| `src/components/RAGChat.tsx` | Make bottom composer background transparent with subtle gradient fade |

