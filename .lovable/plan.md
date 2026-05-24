## Problem

Evie's complaint: AQA Economics Deluxe keeps giving wrong info about the **structure of the paper**, even after 5+ corrections in chat. In-chat corrections don't persist — next session, the model drifts back to whatever it guessed from general training.

## Root cause

I read the AQA Economics trainer system prompt (23k chars, `trainer_projects.system_prompt` for product `17ade690-...`). It covers AOs, level descriptors, marking, diagrams, evaluation lenses — but contains **no authoritative paper structure block**. There is no statement of:

- Paper 1 / 2 / 3 titles, durations, total marks
- Section A vs Section B layout per paper
- Question counts, tariffs, and choice rules (e.g. "one of two contexts", "one of three essays")
- Paper 3 Section A being 30 × 1-mark MCQs

Section 7 references a "10-mark Paper 3 Section B" question and Section 6 references "9-mark Papers 1/2" — these *imply* a structure but never state it. The model is left to improvise, which is exactly what the student is seeing.

I also spotted a stray line in section "DIAGRAMS" (line 348): *"Core part of **Edexcel Economics**…"* — this is the AQA prompt. Likely copy-paste from the Edexcel build. Worth fixing while we're in there since it can leak into responses.

`document_chunks` for this product contains only past papers + mark schemes, no specification chunk, so RAG can't rescue this either.

## Fix

Single targeted edit to `trainer_projects.system_prompt` for product `17ade690-8c44-4961-83b5-0edf42a9faea` via the Build portal pattern (DB update — does not touch any sacred file).

### 1. Insert a new authoritative section right after Section 5 (AOs), titled **"6. PAPER STRUCTURE (AQA 7136)"**, containing the official AQA A-Level Economics structure:

```
Paper 1 — Markets and market failure
  2 hours · 80 marks · 33⅓% of A-Level
  Section A: Data response — answer ONE context out of TWO offered.
    Each context: 5-mark + 5-mark + 10-mark + 25-mark   (overall 40 marks*)
  Section B: Essays — answer ONE essay out of THREE offered.
    Each essay: 15-mark + 25-mark   (40 marks)

Paper 2 — National and international economy
  Identical structure to Paper 1, applied to macro content.

Paper 3 — Economic principles and issues
  2 hours · 80 marks · 33⅓% of A-Level
  Section A: 30 multiple-choice questions, 1 mark each   (30 marks)
  Section B: One case study with stimulus material   (50 marks)
    9-mark + 16-mark + 25-mark
```

I will verify the exact AQA 7136 tariff split before writing (a couple of values above are placeholders — the prompt currently says 9-mark Papers 1/2 and 10-mark Paper 3 Section B, which I'll reconcile against the official AQA spec sheet so the block is right first time). **Before saving, I'll quote you the final block for sign-off** — paper structure is the exact thing the student is being told wrong, so it must be 100% correct.

### 2. Renumber the existing sections 6–13 → 7–14, and update the cross-reference in Section 3 ("apply exact structure from Section 6") to point to the new question-type structures section.

### 3. Fix the "Edexcel Economics" stray line in the diagrams sub-section → "AQA Economics".

### 4. Add a hard rule at the top of the new Paper Structure section:

> "If a student asks about paper structure, timing, mark totals, or question counts, use ONLY the values in this section. Do not infer from general knowledge."

## What this does NOT change

- No code edits. No migration. No RLS, billing, auth, or sacred-file touches.
- No change to RAG, models, or any other subject.
- Edexcel / OCR / GCSE prompts untouched.
- No new features; this is a content correction to one trainer prompt.

## Verification

After the update, I'll:
1. Re-read the saved `system_prompt` to confirm the block is in place.
2. Curl the `rag-chat` edge function with a test query ("what is the structure of AQA Economics Paper 1?") as the logged-in preview user and check the response cites the new block accurately.

## Open question for you

Do you want me to (a) write the structure block from the official AQA 7136 spec myself and show it to you for sign-off before saving, or (b) you paste in the exact tariff split you teach and I drop that in verbatim? Option (b) is safer given the student has already been burned 5+ times.
