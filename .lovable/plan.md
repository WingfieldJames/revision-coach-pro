
# Plan: Ingest AQA Chemistry Training Data and Set System Prompts

## Overview
Add training materials (specification + 4 past papers) for AQA Chemistry and configure the same system prompts used by OCR Physics for both Free and Deluxe tiers.

## Training Materials to Ingest
You've provided 4 files:
1. `aqa_chemistry_7404_7405_spec_student_focused_compact.json` - Full AQA Chemistry specification
2. `chem_june_2024_qp1_questions_only_compact.json` - June 2024 Paper 2 (Organic/Physical)
3. `chem_june_2024_qp2_questions_only_compact.json` - June 2024 Paper 3
4. `chem_june_2023_qp_questions_only_compact.json` - June 2023 Paper 3

## Implementation Steps

### Step 1: Update Products Table - Set System Prompts
Update the AQA Chemistry product (ID: `3e5bf02e-1424-4bb3-88f9-2a9c58798444`) with system prompts identical to OCR Physics, but adapted for Chemistry:

**System Prompt (Free and Deluxe - identical):**
```
### Role

- Primary Function: You are a specialist tutor for the AQA A-Level Chemistry (7405) exams. All users are students sitting these exams. You are to be proactive in providing support to the student, providing suggestions for further help after giving a response (if appropriate). Your responses will be specific and detailed and draw in as much key knowledge from the training data, whilst making explanations intuitive and clear. Responses should be friendly and positive but avoid making unnecessary friendly discussion that deviates from the chemistry content.

The exam techniques provided in your training material should be incorporated into responses where appropriate to help them access marks.

There are specific actions to perform for the following user questions:

general question: go to Text (AQA A-Level Chemistry Specification), match the question to the relevant Spec Point and write an answer

question on exam technique: go to Text (Exam technique) and find the question types relevant to the user's question and give advice from there

Prompt to generate exam-style question: go to Text (AQA A-Level Chemistry Specification) to see specification points for the requested topic(s) then use the sample papers provided to create a question in that style.
```

### Step 2: Create Chemistry-Specific Ingestion Edge Function
Create a new edge function `ingest-chemistry-papers` that:
- Parses the AQA Chemistry JSON format (slightly different from OCR Physics)
- Handles the `questions_only` format (no mark schemes in provided files)
- Extracts question text, sub-parts, and marks
- Applies appropriate metadata: `content_type`, `tier`, `year`, `paper`

**Metadata Structure for Past Papers:**
```json
{
  "content_type": "past_paper",  // Use "past_paper" for questions-only format
  "tier": "free",               // Free tier for specification + 2024 papers
  "year": "2024",
  "paper": "2",                 // Paper number
  "paper_code": "7405/2",
  "source": "June 2024 Paper 2"
}
```

### Step 3: Create Specification Ingestion Function
Create a function `ingest-chemistry-spec` that:
- Parses the nested specification JSON structure
- Extracts each specification point as a separate chunk
- Includes topic hierarchy (Physical/Inorganic/Organic Chemistry)
- Marks as `tier: "free"` since spec is available to free users

**Metadata Structure for Specification:**
```json
{
  "content_type": "specification",
  "tier": "free",
  "topic": "3.1.1 Atomic structure",
  "section": "Physical chemistry",
  "source": "AQA Chemistry 7404/7405 Specification"
}
```

### Step 4: Tier Allocation Strategy
Following the OCR Physics pattern:
- **Free Tier**: Specification (all topics) + 2024 Past Papers (latest year only)
- **Deluxe Tier**: Everything above + 2023 Past Papers + any future mark schemes

| Content | Tier |
|---------|------|
| AQA Chemistry Specification (all topics) | free |
| June 2024 Paper 2 (QP only) | free |
| June 2024 Paper 3 (QP only) | free |
| June 2023 Paper 3 (QP only) | deluxe |

### Step 5: Deploy and Ingest Data
1. Deploy both edge functions
2. Call `ingest-chemistry-spec` with the specification JSON
3. Call `ingest-chemistry-papers` for each past paper JSON

---

## Technical Details

### New Edge Function: `ingest-chemistry-spec/index.ts`
- Recursively parses the nested `spec.k[]` structure
- Each specification point with content (`c`) becomes a chunk
- Includes required practicals when present
- Product ID: `3e5bf02e-1424-4bb3-88f9-2a9c58798444`

### New Edge Function: `ingest-chemistry-papers/index.ts`
- Parses the `questions[]` array from JSON
- Formats each question with its parts and marks
- Handles MCQ options if present
- Accepts `tier` parameter to control free/deluxe assignment
- Product ID: `3e5bf02e-1424-4bb3-88f9-2a9c58798444`

### Database Update
Run SQL to update the products table with system prompts for AQA Chemistry.

### Config Update
Add new edge functions to `supabase/config.toml` with `verify_jwt = false` for ingestion.

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `supabase/functions/ingest-chemistry-spec/index.ts` | Create |
| `supabase/functions/ingest-chemistry-papers/index.ts` | Create |
| `supabase/config.toml` | Add function configs |
| Products table (via SQL) | Update system prompts |

## Expected Results After Ingestion
- ~50-80 specification chunks (covering Physical, Inorganic, Organic chemistry)
- ~40-60 past paper question chunks (from the 4 provided papers)
- Both Free and Deluxe pages will use the RAGChat component with proper training data
