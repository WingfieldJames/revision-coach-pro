

## Problem Analysis

There are **two root causes** for spec points not coming through properly:

### Issue 1: Database query fetches ALL chunk types, then filters client-side with a low limit

In `DynamicPastPaperFinder.tsx` (line 118-123) and `DynamicRevisionGuide.tsx` (line 92-96), the query fetches **all** `document_chunks` for a product with `limit(200)` / `limit(300)`, then filters client-side for `content_type === 'specification'`. If a subject has 500+ total chunks (past papers, mark schemes, etc.), the 200-row limit means most specification chunks never get fetched.

```
// Current (broken for subjects with many chunks):
.eq('product_id', productId)
.limit(200)
// then: .filter(c => c.metadata.content_type === 'specification')
```

### Issue 2: Several legacy pages still fall back to hardcoded spec data

When no `customPastPaperContent` is passed, the toolbar/sidebar renders `PastPaperFinderTool` which loads from hardcoded TypeScript files (`edexcelPastPapers.ts`, etc.) — completely disconnected from the Build portal database.

Pages missing `customPastPaperContent` (using hardcoded past paper finder):
- AQA Economics (Free + Premium)
- AQA Chemistry (Free + Premium)
- AQA Psychology (Free + Premium)
- OCR CS (Free + Premium)
- OCR Physics (Free + Premium)
- Edexcel Maths Pure (Free + Premium)
- Edexcel Maths Applied (Free + Premium)

Pages missing `customRevisionGuideContent` (using hardcoded revision guide):
- CIE Economics (Free + Premium)

---

## Plan

### 1. Fix the database query in DynamicPastPaperFinder

Change the spec-loading query to filter by `content_type = 'specification'` server-side and increase the limit to 1000:

```ts
const { data, error } = await supabase
  .from('document_chunks')
  .select('id, content, metadata')
  .eq('product_id', productId)
  .eq('metadata->>content_type', 'specification')
  .limit(1000);
```

Remove the client-side `.filter()` since it's now done in the query.

### 2. Fix the same query in DynamicRevisionGuide

Apply the identical fix — filter by `content_type = 'specification'` server-side with `limit(1000)`.

### 3. Migrate all legacy pages to use DynamicPastPaperFinder

For every page that currently lacks `customPastPaperContent`, add it pointing to `DynamicPastPaperFinder` with the correct `productId` and `subjectName`. This affects ~14 page files.

### 4. Migrate remaining legacy pages to use DynamicRevisionGuide

For CIE pages missing `customRevisionGuideContent`, add it.

This ensures all subjects pull spec points from the Build portal database rather than hardcoded TypeScript files. No design changes — only the data source for spec point suggestions.

