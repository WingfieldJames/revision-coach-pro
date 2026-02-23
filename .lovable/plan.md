

## Multi-File Past Paper Uploads with Auto-Pairing

Currently each year has a single upload slot. This plan changes it so trainers can upload multiple files per year, and the system automatically identifies which are Question Papers (QPs) and which are Mark Schemes (MSs), pairs them by paper number, and merges them into combined training chunks.

### How It Works

1. Trainer clicks "Add files" for a year (e.g. 2023)
2. Trainer uploads multiple PDFs -- e.g. Paper 1 QP, Paper 1 MS, Paper 2 QP, Paper 2 MS, Paper 3 QP, Paper 3 MS
3. Each file is uploaded to storage and sent to the edge function for classification and extraction
4. The edge function uses Gemini to read the PDF title/header and determine: (a) is it a QP or MS? (b) which paper number?
5. Once a QP+MS pair for the same paper number + year are both processed, the system merges them into combined chunks

### UI Changes

**File: `src/pages/BuildPage.tsx`**

- Replace the single `FileUploadZone` per year with a multi-file area
- Each year row shows all uploaded files as a list of chips/tags (e.g. "Paper 1 QP - done", "Paper 1 MS - processing")
- An "Add file" button allows uploading additional files for that year
- The `<input>` accepts `multiple` so trainers can drag-drop several files at once
- Progress sidebar shows year status based on whether any pairs are fully merged
- The `getUploadForSection` helper is replaced with `getUploadsForYear(year)` returning all uploads for that year
- The `section_type` for all these uploads will be `"past_paper"` (unchanged), but each file gets its own row in `trainer_uploads`

### Edge Function Changes

**File: `supabase/functions/process-training-file/index.ts`**

When `section_type === "past_paper"`:

1. **Classification step** -- Before extraction, ask Gemini to read the document and return a small JSON with:
   - `doc_type`: `"qp"` or `"ms"`
   - `paper_number`: `1`, `2`, `3`, etc.
   - `subject` and `year` (for validation)

2. **Extraction step** -- Based on `doc_type`:
   - QP: Extract questions (number, text, parts, marks)
   - MS: Extract mark scheme answers (question number, marking points, codes)

3. **Store metadata** -- Save `doc_type` and `paper_number` in the `trainer_uploads` row (via a new `metadata` column or by encoding in the existing `section_type` field, e.g. updating section_type to `"past_paper_qp_1"` after classification)

4. **Auto-merge step** -- After processing completes, query `trainer_uploads` for the same `project_id` + `year` to find the matching counterpart (e.g. if we just processed a QP for paper 1, look for a done MS for paper 1). If found:
   - Fetch the `document_chunks` for both uploads (tagged with `upload_id` in metadata)
   - Match questions by question number
   - Create new combined chunks: `"Question X: [text]\n\nMark Scheme: [answers]\n\nTotal Marks: N"`
   - Delete the individual QP-only and MS-only chunks

### Database Changes

**Migration: Add columns to `trainer_uploads`**

```sql
ALTER TABLE trainer_uploads
  ADD COLUMN doc_type text,
  ADD COLUMN paper_number integer;
```

These columns store the AI-classified document type and paper number after processing. They start as NULL and are populated by the edge function.

Also need to store `upload_id` in document_chunks metadata so chunks can be traced back to their source upload for merging.

### Technical Flow

```text
Trainer uploads 6 PDFs for 2023
        |
        v
Each file -> storage + trainer_uploads row (doc_type=NULL)
        |
        v
process-training-file called per file
        |
        v
Step 1: Gemini classifies -> {doc_type: "qp", paper_number: 2}
        |
        v
Step 2: Extract content based on doc_type
        |
        v  
Step 3: Insert chunks with upload_id in metadata
        |
        v
Step 4: Update trainer_uploads with doc_type + paper_number
        |
        v
Step 5: Check for matching counterpart (same year + paper_number, opposite doc_type)
        |
  Found? --> Merge chunks into combined QP+MS format, delete originals
  Not found? --> Done, wait for counterpart
```

### Files to Create/Modify

| File | Action |
|------|--------|
| `src/pages/BuildPage.tsx` | Modify past papers section for multi-file uploads per year |
| `supabase/functions/process-training-file/index.ts` | Add classification, type-specific extraction, and auto-merge logic |
| Migration SQL | Add `doc_type` and `paper_number` columns to `trainer_uploads` |

### Progress Sidebar Updates

Each year's status in the sidebar:
- **Empty** (grey): No files uploaded
- **In progress** (orange): Files uploaded but no complete QP+MS pair merged yet
- **Complete** (green): At least one QP+MS pair fully merged

