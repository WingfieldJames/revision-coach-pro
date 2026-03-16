

## Fix: Strip Duplicate Marks Prefix from Past Paper Question Text

### Problem
Question text from the database chunks contains redundant mark/question prefixes like:
`[15 marks]: Question 6(e) [15 marks]: Discuss methods of...`

The marks are already displayed in the top-right badge via metadata, so the text should just show:
`Question 6(e): Discuss methods of...`

And since the question number is also shown separately as `Q6(e)`, the final displayed text should be:
`Discuss methods of...`

### Root Cause
The `parseChunkDisplay` function in `DynamicPastPaperFinder.tsx` (line 67) only strips `Question X(y):` prefixes but doesn't handle the `[X marks]:` pattern that precedes and/or follows the question number in stored chunks.

### Fix
Update the text-cleaning logic in `parseChunkDisplay` (around lines 66-70) to:

1. Strip any leading `[X marks]:` pattern
2. Strip `Question X(y)` prefix (existing)
3. Strip any remaining `[X marks]:` that appears after the question number

This is a single-file change in `src/components/DynamicPastPaperFinder.tsx`, affecting only the `parseChunkDisplay` function. No design changes — just text cleanup before display.

### Specific Code Change
In `parseChunkDisplay`, before the existing prefix regex, add stripping of `[X marks]:` patterns:

```typescript
// Strip leading "[X marks]:" patterns (may appear multiple times)
questionText = questionText.replace(/^\s*\[\d+\s*marks?\]\s*:?\s*/gi, '');

// Strip "Question X(y):" prefix (existing regex, slightly broadened)
const prefixMatch = questionText.match(/^Question\s+\d+[a-z]?\s*(\([a-z]+\))?\s*(\([a-z]+\))?\s*:?\s*/i);
if (prefixMatch) {
  questionText = questionText.slice(prefixMatch[0].length);
}

// Strip any remaining "[X marks]:" that may follow the question prefix
questionText = questionText.replace(/^\s*\[\d+\s*marks?\]\s*:?\s*/gi, '');
```

This applies globally to all subjects since they all use `DynamicPastPaperFinder`.

