

## Fix Subject Roulette on Homepage

Three changes to `src/pages/HomePage.tsx`:

### 1. Rename subjects
- Change `'CS'` to `'Computing'` and `'Maths'` to `'Mathematics'` in the subjects array (line 97).

### 2. Fix vertical alignment
- The animated text container uses `height: '1em'` and `verticalAlign: 'text-bottom'`, which causes the cycling text to sit slightly too high.
- Change `verticalAlign` to `'baseline'` and adjust the height to `'1.2em'` so the text aligns with "A-Level".

### 3. Fix clipping on longer words
- The container has a fixed `width: '5.5em'` which clips longer words like "Psychology", "Computing", and "Mathematics".
- Increase the width to `'7.5em'` to accommodate the longest word ("Mathematics").

### Technical details

**File: `src/pages/HomePage.tsx`**

**Line 97** -- Update subjects array:
```tsx
const subjects = ['Economics', 'Computing', 'Chemistry', 'Psychology', 'Physics', 'Mathematics'];
```

**Line 139** -- Update the container dimensions and alignment:
```tsx
<span className="relative inline-block overflow-hidden text-left" style={{ width: '7.5em', height: '1.2em', verticalAlign: 'baseline' }}>
```
