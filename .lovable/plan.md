

## Fix DynamicRevisionGuide to Fully Work with Build Data

### Issues Found

1. **Wrong board label in AI prompt**: `DynamicRevisionGuide` sends `board: 'dynamic'`, which the edge function maps to `spec_name` as the board label. So the AI gets "studying Aggregate Demand" instead of "studying Edexcel A Level Economics". All 16 pages are affected.

2. **Past Paper Questions toggle is broken**: The component sends `past_paper_context: ''` (always empty). The edge function only includes past paper questions in the prompt when `past_paper_context` is non-empty (line 244). So the "Past Paper Questions" toggle does nothing.

3. **Edge function queries are not filtered by content_type**: Three "parallel" queries all fetch from `document_chunks` with the same filter (just `product_id`), returning overlapping/duplicate rows instead of targeting spec, technique, and paper chunks separately.

### Fix 1: Pass `subject_name` to Edge Function

**Client (`DynamicRevisionGuide.tsx`)**: Add `subject_name` to the request body instead of relying on `board` for label resolution.

```typescript
body: JSON.stringify({
  product_id: productId,
  spec_code: selectedSpec.code,
  spec_name: selectedSpec.name,
  board: 'dynamic',
  subject_name: subjectName, // NEW — "Edexcel Economics", "OCR Computer Science", etc.
  options: enabledOptions.map(o => o.id),
  ...
})
```

**Edge function**: Accept `subject_name` and use it for the `dynamic` board label:
```typescript
board === "dynamic" ? (subject_name || spec_name) :
```

### Fix 2: Server-Side Past Paper Retrieval

Instead of requiring the client to send past paper context (which only legacy `RevisionGuideTool` could do with hardcoded data), make the edge function auto-fetch relevant past paper chunks when `past_papers` is in options.

In `generate-revision-guide/index.ts`, after the existing chunk fetching, add a dedicated past paper query:

```typescript
let pastPaperContext = past_paper_context; // Use client-provided if available (legacy)

// If client didn't provide past paper context but option is enabled, fetch from DB
if (!pastPaperContext && options.includes("past_papers")) {
  const { data: paperChunks } = await supabaseAdmin
    .from("document_chunks")
    .select("content, metadata")
    .eq("product_id", product_id)
    .limit(200);
  
  // Filter for past paper chunks matching the topic
  const matchedPapers = (paperChunks || []).filter(chunk => {
    const ct = String(chunk.metadata?.content_type || "");
    if (!ct.includes("paper") && !ct.includes("combined") && !ct.includes("question")) return false;
    const content = chunk.content.toLowerCase();
    return specKeywords.filter(kw => content.includes(kw)).length >= 2;
  }).slice(0, 8);
  
  if (matchedPapers.length > 0) {
    pastPaperContext = matchedPapers.map(p => {
      const qNum = p.metadata?.question_number || "";
      const marks = p.metadata?.total_marks || "";
      const year = p.metadata?.year || "";
      const paper = p.metadata?.paper_number ? `Paper ${p.metadata.paper_number}` : "";
      return `- **${year} ${paper} Q${qNum}** (${marks} marks): ${p.content.slice(0, 200)}`;
    }).join('\n');
  }
}
```

Then use `pastPaperContext` instead of `past_paper_context` in the prompt condition on line 244.

### Fix 3: Filter Parallel Queries by Content Type

Replace the three identical queries with properly filtered ones:

```typescript
const [specResult, techniqueResult, paperResult] = await Promise.all([
  supabaseAdmin.from("document_chunks").select("content, metadata")
    .eq("product_id", product_id)
    .eq("metadata->>content_type", "specification")
    .limit(50),
  supabaseAdmin.from("document_chunks").select("content, metadata")
    .eq("product_id", product_id)
    .eq("metadata->>content_type", "exam_technique")
    .limit(20),
  supabaseAdmin.from("document_chunks").select("content, metadata")
    .eq("product_id", product_id)
    .not("metadata->>content_type", "in", "(specification,exam_technique)")
    .limit(100),
]);
```

### Files to Edit

1. **`src/components/DynamicRevisionGuide.tsx`** — Add `subject_name` to request body (1 line)
2. **`supabase/functions/generate-revision-guide/index.ts`** — Accept `subject_name`, fix board label, add server-side past paper fetch, fix content_type filtering on parallel queries

### No Design Changes

The UI stays exactly the same. These are all backend data-flow fixes to ensure the revision guide produces correct, contextual output using Build-uploaded training data.

