
# Upload Training Data to AQA Psychology

Upload 4 files to the AQA Psychology product (ID: `c56bc6d6-5074-4e1f-8bf2-8e900ba928ec`), including two separate specifications that are served conditionally based on the student's year group.

---

## Spec Routing Logic

The user's year (set in "My AI" preferences) determines which specification applies:

| Year (Feb 2026) | Exam Date | Spec Used |
|---|---|---|
| Year 13 | June 2026 | **2016 spec** (old, "spec for 2026") |
| Year 12 | June 2027 | **2027 spec** (new, "spec 2027 onwards") |

Both specs will be ingested as separate chunks, tagged with a `spec_version` metadata field (`"2026"` or `"2027"`). The `rag-chat` edge function will then be updated to filter specification chunks based on the user's year group before injecting context.

---

## Files to Upload

| File | Content Type | Chunks (approx) | Details |
|---|---|---|---|
| system_prompt.txt | System prompt | 1 (DB update) | Short 2-line persona -- will be combined with exam_technique.txt |
| exam_technique.txt | exam_technique | 1 chunk | 47-line detailed A* exam methodology, AO weighting, essay structure |
| spec_2016_onwards.json | specification | ~12 chunks (pages 13-24) | Old spec for current Year 13s (exams June 2026), tagged `spec_version: "2026"` |
| spec_2027_onwards.json | specification | ~12 chunks (pages 13-24) | New spec for current Year 12s (exams June 2027+), tagged `spec_version: "2027"` |

---

## Implementation Steps

### Step 1: Update the system prompt

Combine `system_prompt.txt` (the short persona line) with the full `exam_technique.txt` content into a single `system_prompt_deluxe` for the product. The system prompt file says to use the exam technique notes, so they belong together as the base persona.

### Step 2: Ingest exam technique as a document chunk

Also ingest the exam_technique.txt content as a `content_type: "exam_technique"` chunk so it's available in RAG context retrieval when students ask about essay structure or marks.

### Step 3: Ingest the 2016 specification (for Year 13 / June 2026 exams)

Extract the subject content pages (pages 13-24) from `spec_2016_onwards.json` and chunk by topic section:
- 3.1.1 Social influence, 3.1.2 Memory, 3.1.3 Attachment
- 3.2.1 Approaches, 3.2.1.1 Biopsychology, 3.2.2 Psychopathology, 3.2.3 Research methods
- 4.1-4.3 A-level content (full topic breakdown)

Each chunk tagged with `spec_version: "2026"`.

### Step 4: Ingest the 2027 specification (for Year 12 / June 2027+ exams)

Same structure but from `spec_2027_onwards.json`. Key differences include:
- "Psychopathology" renamed to "Clinical Psychology and Mental Health"
- Removal of Zimbardo conformity, types of LTM, Wundt/introspection
- Addition of new content in Gender (gender identities, non-binary)
- Changes in Forensic (typology approach replaces top-down/bottom-up)
- Removal of biological rhythms from Biopsychology

Each chunk tagged with `spec_version: "2027"`.

### Step 5: Update `rag-chat` edge function

Modify the `fetchRelevantContext` function to:
1. Read the user's year from `user_preferences.year`
2. When fetching `specification` chunks for the Psychology product, filter by `spec_version` metadata:
   - Year 13 -> filter `spec_version = "2026"`
   - Year 12 -> filter `spec_version = "2027"`
3. Non-specification chunks (past papers, exam technique, etc.) are shared across both specs

### Step 6: Update `buildPersonalizedPrompt` in rag-chat

Add Psychology-specific year context to the student context block:
- Year 13: "You are sitting the 2016 specification (exams June 2026). Use the spec for 2026."
- Year 12: "You are sitting the 2027 specification (exams June 2027 onwards). Use the spec 2027 onwards."

This aligns with the exam_technique.txt instruction: "first look at the correct specification from text snippets (spec for 2026) or (spec 2027 onwards)".

---

## After State

| Content Type | Chunks | Notes |
|---|---|---|
| System Prompt | Updated | Combined persona + exam technique (approx 12,000 chars) |
| exam_technique | 1 | Full AO weighting and essay methodology |
| specification (2026) | ~12 | Old spec, served to Year 13 students |
| specification (2027) | ~12 | New spec, served to Year 12 students |
| **Total** | **~25 chunks** | |

---

## Technical Details

### Files Modified
- `supabase/functions/rag-chat/index.ts` -- Add spec_version filtering logic based on user year and product subject
- `supabase/config.toml` -- No changes needed (rag-chat already registered)

### Database Changes
- `products` table: UPDATE `system_prompt_deluxe` for product `c56bc6d6-5074-4e1f-8bf2-8e900ba928ec`
- `document_chunks` table: INSERT ~25 new chunks via `ingest-content` edge function

### No Frontend Changes Required
- The "My AI" preferences component already supports Year 12 / Year 13 selection
- User preferences are already passed to the rag-chat function
- The spec routing is entirely server-side in the edge function
