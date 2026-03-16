

## Deploy OCR Economics to Website

### Current State
The OCR Economics project exists in `trainer_projects` (id: `ec6213b9-...`) with a linked product (id: `5e5045ca-...`, slug: `ocr-economics`), but:
- Product is **inactive** (`active: false`) -- not visible on the website
- **231 past paper chunks** are already in `document_chunks` (all past papers processed)
- **268 specification points** are staged but NOT yet deployed to `document_chunks`
- **System prompt** (6,021 chars) exists but NOT deployed to `document_chunks`
- **No exam technique** text has been submitted

### What it's trained on
- **Past Papers**: 24 PDFs across 4 years (2021-2024), 3 papers each (Microeconomics P1, Macroeconomics P2, Themes in Economics P3) -- both QPs and mark schemes, totalling 231 combined chunks
- **Specification**: 268 points (staged, needs embedding + deploying)
- **System Prompt**: 6,021 character custom prompt
- **Trainer**: Henry Li, LSE PPE Student
- **Features enabled**: My AI, Past Papers, Revision Guide, Diagram Generator, Essay Marker, Exam Countdown, My Mistakes, Grade Boundaries
- **Essay Marker marks**: 3, 4, 8, 12, 25
- **Exam dates**: Paper 1 (2026-05-11), Paper 2 (2026-05-18), Paper 3 (2026-06-04)
- **Suggested prompts**: 4 custom prompts configured

### Deployment Plan

1. **Call the `deploy-subject` edge function** with the project ID to:
   - Embed and save the 268 specification points to `document_chunks`
   - Embed and save the system prompt to `document_chunks`
   - Set the product `active: true` and update `system_prompt_deluxe`

2. **Verify** the product is active and accessible at `/s/ocr-economics/free` and `/s/ocr-economics/premium`

No code changes are needed -- the dynamic route infrastructure (`DynamicFreePage`/`DynamicPremiumPage`) already handles any active product by slug. The deployment is purely a database + edge function operation.

### Technical Details
- Edge function: `deploy-subject` with `{ project_id: "ec6213b9-b184-41fc-8237-d248025fec28", staged_specifications: [...268 points from trainer_projects], staged_system_prompt: "..." }`
- Alternatively, call `activate_website: true` to just flip `active` to `true` if specs were already meant to be deployed separately
- The product will appear on the `/compare` page and be accessible via dynamic routes

