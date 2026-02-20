

# Upload AQA Psychology June 2024 Papers 1, 2 and 3 (with Mark Schemes)

Ingest all three uploaded past papers into the RAG training database and populate the Past Paper Finder so students can search for questions by topic.

---

## What is being uploaded

| File | Paper Code | Items | Content |
|---|---|---|---|
| Paper 1 (June 2024) | 7182/1 | ~15 questions | Social Influence, Memory, Attachment, Psychopathology + mark schemes |
| Paper 2 (June 2024) | 7182/2 | ~25 questions | Approaches, Biopsychology, Research Methods + mark schemes |
| Paper 3 (June 2024) | 7182/3 | ~40 questions | Issues and Debates, Relationships, Gender, Cognition and Development, Schizophrenia, Eating Behaviour, Stress, Aggression, Forensic Psychology, Addiction + mark schemes |

---

## Step 1: Ingest into RAG database

Call the `ingest-content` edge function three times (once per paper) to insert combined QP+MS chunks into `document_chunks` for product `c56bc6d6-5074-4e1f-8bf2-8e900ba928ec`.

Each question becomes one chunk containing the question text and mark scheme together (the proven QP+MS combined format used for OCR Physics). Metadata tags:

```text
content_type: "paper_1" / "paper_2" / "paper_3"
year: "2024"
paper: "June 2024 Paper 1" etc.
question_number: "001" etc.
source: "AQA 7182/1 June 2024"
```

Estimated chunks: ~80 total across all three papers.

## Step 2: Populate the Past Paper Finder

Update `src/data/aqaPsychologyPastPapers.ts` to fill the currently empty `AQA_PSYCHOLOGY_PAST_QUESTIONS` array with entries for every question across all three papers.

Each entry maps a question to its relevant specification codes. For example:
- Q001 (Paper 1): "Outline one ethical issue in social influence research" maps to `["3.1.1.1"]` (Social Influence)
- Q103 (Paper 1): "Discuss Romanian orphan studies" maps to `["3.1.3.10"]`
- Q106 (Paper 1): "Discuss the cognitive approach to explaining depression" maps to `["3.1.4.6"]`

This enables students to search by topic and find matching past paper questions.

## Step 3: No other changes needed

- No edge function changes required (rag-chat already handles Psychology with conditional spec filtering)
- No frontend changes required (Past Paper Finder and Revision Guide already configured for Psychology)
- The Revision Guide will automatically benefit from the new training data via RAG context

---

## Files Modified

| File | Change |
|---|---|
| `src/data/aqaPsychologyPastPapers.ts` | Populate `AQA_PSYCHOLOGY_PAST_QUESTIONS` with ~80 entries mapping questions to spec codes |

## Database Changes

| Table | Change |
|---|---|
| `document_chunks` | INSERT ~80 new chunks via `ingest-content` edge function |

