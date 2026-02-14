

## Fix: Revision Guide Body Text Not Rendering in PDF

### Problem
The `markdownToHtml` function in `RevisionGuideTool.tsx` has a bug in its line-by-line HTML conversion. After converting markdown bold (`**text**`) to `<strong>text</strong>`, the function checks if a line starts with `<` to decide whether to wrap it in a `<p>` tag. Lines starting with inline HTML like `<strong>`, `<em>`, or `<code>` incorrectly skip the `<p>` wrapper, causing them to render as floating inline fragments that html2pdf.js ignores.

This is why headings (block-level `<h1>`-`<h4>`) render fine, but body text (often starting with bold key terms) vanishes entirely.

### Fix (single file change)

**File: `src/components/RevisionGuideTool.tsx`** (line ~286)

Change the condition from "doesn't start with `<`" to "doesn't start with a **block-level** HTML tag". This ensures inline HTML like `<strong>`, `<em>`, `<code>` still gets wrapped in `<p>`, while actual block elements (`<h1>`-`<h4>`, `<pre>`, `<ul>`, `<div>`, `<table>`) are left as-is.

```typescript
// BEFORE (broken)
if (line.trim() && !line.trim().startsWith('<')) {
    result.push(`<p>${line}</p>`);
} else {
    result.push(line);
}

// AFTER (fixed)
const blockTags = /^<(h[1-6]|p|pre|ul|ol|li|div|table|tr|th|td|blockquote|hr)/i;
if (line.trim() && !blockTags.test(line.trim())) {
    result.push(`<p>${line}</p>`);
} else {
    result.push(line);
}
```

### What stays the same
- Everything else in the component (search, spec selection, options, PDF styling, download logic, diagram matching)
- The edge function (`generate-revision-guide`) is unchanged
- Dark mode / light mode styling is unchanged
- All other pages and components are untouched

