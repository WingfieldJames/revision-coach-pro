

# Build Portal: Trainer Dashboard for Subject Training Data

## Overview

A hidden `/build` page where authorized trainers (A* students) can create and manage training data for new subjects without any technical experience. Trainers select a subject/board, fill in content sections (system prompt, specification, exam technique, past papers), preview the AI model in a live chatbot, and deploy when ready.

## Architecture

### 1. Access Control

- Create a `user_roles` table with an `app_role` enum (`admin`, `trainer`, `user`)
- Create a `has_role()` security definer function to avoid RLS recursion
- The `/build` route is not linked anywhere on the site -- trainers access it by typing the URL directly
- On page load, check if the logged-in user has the `trainer` or `admin` role; if not, show an "Access Denied" message
- You (the team) manually add trainer roles via Supabase SQL editor when onboarding a new A* student

### 2. Database: New Tables

**`trainer_projects` table** -- stores each subject build project and all its text content (auto-saved):

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | Project ID |
| product_id | uuid (FK to products, nullable) | Linked product once deployed |
| subject | text | e.g. "Biology" |
| exam_board | text | e.g. "AQA" |
| system_prompt | text | The tutor persona / system prompt |
| exam_technique | text | Exam technique content |
| custom_sections | jsonb | Array of {name, content} for trainer-created sections |
| status | text | "draft" / "review" / "deployed" |
| created_by | uuid | Trainer's user ID |
| created_at / updated_at | timestamps | |

All text fields auto-save on change (debounced) so nothing is lost. Any trainer with access can view and edit any project.

**`trainer_uploads` table** -- tracks file uploads and their processing status:

| Column | Type | Purpose |
|--------|------|---------|
| id | uuid (PK) | |
| project_id | uuid (FK) | Links to trainer_projects |
| section_type | text | "specification", "paper_1", "paper_2", "paper_3", etc. |
| year | text (nullable) | "2024", "2023", etc. for past papers |
| file_name | text | Original file name |
| file_url | text | Supabase Storage URL |
| processing_status | text | "pending" / "processing" / "done" / "error" |
| chunks_created | integer | Number of document_chunks generated |
| created_at | timestamp | |

### 3. Storage

- Create a `trainer-uploads` storage bucket (private)
- RLS: Only users with `trainer` or `admin` role can upload/read

### 4. Edge Functions

**`process-training-file`** -- The core AI conversion function:
- Receives a file URL, section type, and project ID
- Downloads the file from storage
- Sends it to Gemini (via Lovable AI gateway) with a carefully crafted prompt for each section type:
  - **Specification**: "Extract all specification points, topics, and sub-topics. Output as structured JSON chunks with topic hierarchy."
  - **Past Papers (combined QP+MS)**: "Extract each question with its sub-parts and mark scheme. Group as one chunk per question. Include mark allocations (M1, A1, B1 codes)."
- Inserts the resulting chunks into `document_chunks` with proper metadata (content_type, year, topic, etc.)
- Updates `trainer_uploads.processing_status` to "done" with chunk count

**`deploy-subject`** -- Triggered when trainer clicks Deploy:
- Creates a new row in `products` table with the subject name, exam board, slug, system prompt, and pricing placeholders
- Copies all `document_chunks` from the project to be associated with the new product_id
- Updates `trainer_projects.status` to "deployed"
- Returns the new product details (you manually add Stripe links and routes later)

### 5. Frontend: `/build` Page

The page is organized into a single-page dashboard with these sections:

#### Header
- Subject/Board selector (dropdown, starting with "AQA Biology")
- Project status indicator (Draft / Review / Deployed)

#### Content Sections (left column, scrollable)
Each section has a status indicator that the trainer can toggle:
- Empty (grey circle)
- In progress (orange circle)
- Complete (green tick)

Sections:
1. **System Prompt** -- Large text area, auto-saves. Positioned directly below the mock chatbot for easy tweaking.
2. **Exam Technique** -- Large text area, auto-saves.
3. **Specification** -- File upload zone. When a file is uploaded, it shows processing status, then a green tick when chunks are created.
4. **Past Papers** -- Grid with years 2024-2020 as rows. Each row has an upload zone for the combined QP+MS file. A checkbox column on the right lets the trainer tick off completed years.
5. **Custom Sections** -- "Add Section" button. Trainer names the section and adds text or uploads a file.

#### Mock Chatbot (right column, sticky)
- A working chatbot that uses the `rag-chat` edge function
- Connected to the project's product_id (created as a draft product on first save)
- Uses the trainer's current system prompt text
- Lets the trainer test and refine their model in real time

#### Deploy Button
- At the bottom, a "Deploy" button that triggers the `deploy-subject` edge function
- Shows confirmation dialog: "This will make the subject live. Continue?"

### 6. Auto-Save Mechanism

- All text fields (system prompt, exam technique, custom sections) debounce-save to `trainer_projects` every 2 seconds after the last keystroke
- Any user with the `trainer` role can see and edit the same project data
- No per-user isolation -- this is collaborative by design

### 7. Past Paper Upload Flow

Since combined QP+MS is confirmed:
1. Trainer uploads a single PDF/file per year containing questions followed by mark scheme answers
2. The file is stored in the `trainer-uploads` bucket
3. The `process-training-file` edge function is called automatically
4. AI extracts each question + its marks into a structured chunk
5. Status updates: pending -> processing -> done (green tick)
6. The year checkbox auto-ticks when processing completes

### 8. Regarding Your Question: Combined vs Separate

**Combined (QP + MS together) is better for Supabase/RAG** because:
- Your existing OCR Physics data already uses this format successfully (~165 chunks)
- Each chunk contains the full context (question + expected answer + mark allocation)
- The AI can learn marking style and generate practice questions that mirror real exam standards
- No risk of misalignment between questions and answers

## Technical Steps (Implementation Order)

1. **Database migration**: Create `app_role` enum, `user_roles` table, `has_role()` function, `trainer_projects` table, `trainer_uploads` table, RLS policies
2. **Storage**: Create `trainer-uploads` bucket with RLS
3. **Edge function**: `process-training-file` -- AI-powered file-to-chunks conversion
4. **Edge function**: `deploy-subject` -- Creates product and finalizes
5. **Frontend**: `/build` page with all sections, auto-save, status indicators
6. **Frontend**: Mock chatbot integration using existing `rag-chat` function
7. **Seed data**: Insert "AQA Biology" as a draft product option

## What You'll Still Need to Do Manually After Deploy

- Add Stripe price IDs to the new product
- Add the frontend routes (free/premium pages) for the new subject
- Add the subject to the `/compare` page selector
- Assign trainer roles to A* students via SQL: `INSERT INTO user_roles (user_id, role) VALUES ('...', 'trainer')`

