
# Plan: Ingest OCR Physics Past Paper Training Data for Deluxe

## Overview

This plan covers ingesting 9 JSON files containing OCR Physics A-Level past papers and mark schemes (2022, 2023, 2024 - Papers 1, 2, and 3) into the RAG training database for **Deluxe users only**. These files will enable the AI tutor to understand question/mark scheme styles and generate or mark exam-style questions.

## Current State Analysis

**Existing Training Data for OCR Physics:**
| Content Type | Tier | Count |
|--------------|------|-------|
| specification | deluxe | 20 |
| specification | free | 20 |
| exam_technique | free | 6 |
| past_paper | free | 93 |

**Key Observations:**
- No past paper data currently exists for Deluxe tier
- The system prompt already instructs the AI to use "sample papers provided to create a question in that style"
- The `rag-chat` edge function has smart routing that prioritizes `paper_1`, `paper_2`, `paper_3` content types when users ask for practice questions

**Product ID:** `ecd5978d-3bf4-4b9c-993f-30b7f3a0f197`

## JSON File Structure

Each file is a structured QP+MS (Question Paper + Mark Scheme) pair containing:
```json
{
  "v": "qp_ms_pair_v1",
  "src": { "qp": {...}, "ms": {...} },
  "paper": { "paper_id", "subject", "time_allowed", "total_marks", ... },
  "mark_scheme": { "paper_code", "session" },
  "items": [
    {
      "q": { "n": 1, "star": false, "t": "Question text", "m": 1, "o": [...], "p": [...] },
      "ms": { "parts": [{ "id": "1", "raw": "Mark scheme guidance", "codes": ["M1","A1"] }] }
    }
  ]
}
```

## Implementation Steps

### 1. Create Ingestion Edge Function for Physics Past Papers

Create a new edge function `ingest-physics-papers` that:
- Parses the structured JSON format
- Extracts each question-answer pair as a separate chunk
- Formats content to be AI-readable (combining question text with mark scheme)
- Applies correct metadata for routing

**Metadata Schema for Each Chunk:**
```json
{
  "content_type": "paper_1" | "paper_2" | "paper_3",
  "tier": "deluxe",
  "year": "2024" | "2023" | "2022",
  "paper": "1" | "2" | "3",
  "paper_code": "H556/01" | "H556/02" | "H556/03",
  "question_number": 1,
  "marks": 3,
  "is_starred": false,
  "source": "June 2024 QP 1"
}
```

### 2. Chunking Strategy

Each question will become a separate document chunk with this format:

```text
[June 2024 Paper 1 - Question 16(a)(i)] [3 marks]

QUESTION:
A car of weight 9300 N is moving at speed v. The total resistive force, 
F, acting against the motion of the car is given by F = kv²...
Sketch a graph on the axes below to show how the speed of the car changes 
over time.

MARK SCHEME:
- Curve starting at origin with decreasing gradient [B1]
- Curve levelling off at or approaching 30 [B1]

EXAMINER GUIDANCE:
Allow starting slightly above origin if shown speeding up initially
```

This format allows the AI to:
- Understand the question style and mark allocation
- See exactly what examiners are looking for
- Learn the marking codes (M1, A1, B1, C1)

### 3. Paper-Specific Content Types

Use granular content types that match the rag-chat routing:

| Paper | Content Type | Description |
|-------|-------------|-------------|
| Paper 1 | `paper_1` | Modelling Physics (100 marks, 2h15m) |
| Paper 2 | `paper_2` | Exploring Physics (100 marks, 2h15m) |
| Paper 3 | `paper_3` | Unified Physics (70 marks, 1h30m) |

### 4. Files to Process

| File | Year | Paper | Questions |
|------|------|-------|-----------|
| june_2024_qp1_ms1_compact.json | 2024 | 1 | 20 |
| june_2024_qp2_ms2_compact.json | 2024 | 2 | ~20 |
| june_2024_qp3_ms3_compact.json | 2024 | 3 | ~15 |
| june_2023_qp1_ms1_compact.json | 2023 | 1 | ~20 |
| june_2023_qp2_ms2_compact.json | 2023 | 2 | ~20 |
| june_2023_qp3_ms3_compact.json | 2023 | 3 | ~15 |
| june_2022_qp1_ms1_compact.json | 2022 | 1 | ~20 |
| june_2022_qp2_ms2_compact.json | 2022 | 2 | ~20 |
| june_2022_qp3_ms3_compact.json | 2022 | 3 | ~15 |

**Estimated Total:** ~160-180 question chunks

---

## Technical Implementation

### Edge Function: `ingest-physics-papers/index.ts`

```typescript
// Parses the QP+MS JSON format
// Extracts each question as a formatted chunk
// Inserts into document_chunks with tier: "deluxe"
```

Key processing logic:
1. Parse JSON structure
2. Extract paper metadata (year, paper number, paper code)
3. For each item in `items` array:
   - Extract question text from `q.t` and sub-parts `q.p`
   - Extract mark allocation from `q.m`
   - Extract mark scheme from `ms.parts`
   - Format into readable chunk
   - Apply metadata

### Multiple Choice Handling

MCQ questions have options in `q.o` array:
```json
{ "k": "A", "t": "Option A text" },
{ "k": "B", "t": "Option B text" }
```

These should be formatted clearly:
```text
A) Option A text
B) Option B text
C) Option C text  
D) Option D text

CORRECT ANSWER: C
```

### Sub-Part Questions

Questions with sub-parts (`q.p`) should be chunked together with their parent question for context, or split if they're substantial enough to stand alone.

---

## Expected Outcome

After ingestion:
- **Deluxe users** will have access to 3 years of past papers
- The AI can generate questions in OCR style by referencing real examples
- The AI can mark student answers using real mark scheme guidance
- Smart routing will prioritize paper content when users ask for practice questions

**Updated Training Data Counts:**
| Content Type | Tier | Estimated Count |
|--------------|------|-----------------|
| paper_1 | deluxe | ~60 |
| paper_2 | deluxe | ~60 |
| paper_3 | deluxe | ~45 |
| specification | deluxe | 20 |
| specification | free | 20 |
| exam_technique | free | 6 |
| past_paper | free | 93 |

---

## Post-Implementation

1. **Update System Prompt** (optional enhancement): Add explicit instructions about using past paper data for question generation
2. **Test the RAG Chat**: Verify that asking "generate a Paper 1 style question on momentum" returns relevant question examples
3. **Monitor Logs**: Check edge function logs to ensure proper retrieval of past paper content

