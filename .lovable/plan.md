
# Upload Training Data to Edexcel Maths (Pure)

Upload 5 files to the Edexcel Mathematics Pure product, updating both the system prompt and RAG knowledge base.

---

## Files to Upload

| File | Type | Destination | Action |
|------|------|-------------|--------|
| System_prompt.txt | System prompt (459 lines) | `products` table `system_prompt_deluxe` field | UPDATE existing prompt (currently 2,686 chars) with new comprehensive 459-line persona |
| spec-2.json | Specification (Issue 4, 1,893 lines) | `document_chunks` table | Ingest as `specification` chunks (supplements existing 78 chunks) |
| P1_23_QP.json | Paper 1 June 2023 Question Paper (15 questions, 100 marks) | `document_chunks` table | Ingest as `past_paper` chunks |
| P1_24_QP.json | Paper 1 June 2024 Question Paper (15 questions, 100 marks) | `document_chunks` table | Ingest as `past_paper` chunks |
| P1_24_MS.json | Paper 1 June 2024 Mark Scheme (1,933 lines, full mark breakdowns) | `document_chunks` table | Ingest as `mark_scheme` chunks |

---

## Product Targets

All data goes to product ID `f47ac10b-58cc-4372-a567-0e02b2c3d479` (Edexcel Mathematics). Both free and deluxe tiers share the same product ID and document_chunks -- the tier difference is controlled by subscription access, not separate data.

---

## Implementation Steps

### Step 1: Update the system prompt
Update the `system_prompt_deluxe` column in the `products` table for the Pure Maths product with the full content of `System_prompt.txt`. This replaces the existing shorter prompt with the comprehensive 459-line persona covering pedagogy, mark scheme conventions, and exam technique.

### Step 2: Ingest the specification (spec-2.json)
Chunk the Issue 4 specification into the `document_chunks` table with metadata `content_type: "specification"`. This is a newer, more detailed version than what's currently stored (78 chunks). Each chunk will be tagged with the relevant topic section (e.g., "Topic 2 - Algebra and functions").

### Step 3: Ingest Paper 1 June 2023 QP
Chunk each question from P1_23_QP.json into `document_chunks` with metadata:
- `content_type: "past_paper"`
- `paper: "9MA0/01"`
- `year: "2023"`
- `topic`: mapped per question (e.g., "Algebraic integration", "Vectors")

### Step 4: Ingest Paper 1 June 2024 QP
Same approach as Step 3 but for the 2024 paper, including all 15 questions with detailed content fields, topic tags, and mark values.

### Step 5: Ingest Paper 1 June 2024 Mark Scheme
Chunk each question's marking scheme from P1_24_MS.json with metadata:
- `content_type: "mark_scheme"`
- `paper: "9MA0/01"`
- `year: "2024"`
- Individual M/A/B mark breakdowns preserved per question

### Step 6: Post-upload report
Query the database to produce a summary of all training data for Edexcel Maths, broken down by content type and chunk count.

---

## Current vs. After State

| Content Type | Before | After |
|-------------|--------|-------|
| Specification | 78 chunks | 78 + new Issue 4 chunks |
| Past Papers | 0 | P1 2023 + P1 2024 (approx 30 chunks) |
| Mark Schemes | 0 | P1 2024 MS (approx 15-20 chunks) |
| System Prompt | 2,686 chars | Full 459-line comprehensive persona |

---

## Technical Details

- All ingestion uses the existing `ingest-content` edge function
- System prompt update requires a direct database update via the `products` table
- Each question is chunked individually to enable precise RAG retrieval by topic
- The specification will be chunked by topic section for granular matching
- No code file changes needed -- this is purely data ingestion
