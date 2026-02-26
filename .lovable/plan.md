
Goal: fix four linked issues in the trainer portal with one coherent pass:
1) Edexcel Maths spec JSON parsing fails.
2) Build page is not fully synced with live chatbot/training data (Meet the Brain, System Prompt, Past Papers, Custom Sections, Website Deployment settings).
3) “You have unsaved changes” appears on initial load.
4) Add trainer-only `/build/about` guide page + “How do I use the training portal?” entry button in `/build`.

What’s causing the current problems
- Unsaved banner false-positive is caused by hydration side effects:
  - async field hydration runs after initial render,
  - `onSpecDataChange` can fire during mount,
  - current `hydrationCountRef` approach is brittle and not true “state vs DB” diffing.
- Build hydration currently only pulls part of the live data model (mostly text/spec), and does not fully reconcile:
  - `products.system_prompt_deluxe`,
  - existing past-paper chunks in `document_chunks` when `trainer_uploads` records are missing/incomplete,
  - legacy live feature settings hardcoded in subject pages.
- Spec JSON parsing is too strict in the editor/parser path (expects a narrow shape), so valid real-world Edexcel JSON structures fail.
- `/build` has no linked usage guide page.

Implementation sequence

1) Replace hydration-counter dirty tracking with canonical snapshot diffing
- In `BuildPage`, introduce a normalized “saved snapshot” model for the selected project.
- Compute unsaved status by deep-compare:
  - current normalized form state vs loaded/saved snapshot.
- Include all fields that should affect save/deploy:
  - system prompt, exam technique, trainer image/url, trainer description,
  - spec points, custom sections,
  - selected features, exam dates, essay marker marks,
  - past-paper year submission state.
- Remove brittle `hydratedRef/hydrationCountRef` logic.
- Ensure initial load and async hydration update the baseline snapshot before dirty checks start.
- Result: banner only appears after genuine user changes relative to DB-loaded state.

2) Harden specification JSON parsing (Edexcel Maths fix)
- Extend spec parsing/normalization to accept multiple valid input shapes:
  - array of strings,
  - `{ specifications: [...] }`,
  - array/object entries with fields like `content`, `point`, `name`, `text`.
- Normalize to `string[]` before storing in page state.
- If incoming format is invalid/unusable, fail safely:
  - show no spec points for that subject,
  - keep section empty instead of leaking other subject data.
- Apply same normalization on:
  - JSON editor apply flow,
  - project hydration from DB/chunks (defensive).

3) Full Build sync with live data (subject by subject)
- Expand hydration precedence in `BuildPage`:
  - System Prompt: `trainer_projects.system_prompt` -> `document_chunks(system_prompt)` -> `products.system_prompt_deluxe`.
  - Exam Technique: `trainer_projects.exam_technique` -> `document_chunks(exam_technique)`.
  - Specification: `trainer_projects.staged_specifications` -> normalized `document_chunks(specification)`.
  - Meet the Brain + deployment settings: from `trainer_projects` (with backfill described below).
  - Custom sections: `trainer_projects.custom_sections`; if empty, optionally derive from `document_chunks(custom_section)` format `[Section]\n...`.
- Past papers:
  - keep existing `trainer_uploads` pipeline,
  - add fallback derived view when uploads are missing but paper chunks exist in `document_chunks` (so existing live training data is visible in Build instead of appearing empty).

4) Data backfill/sync into database so Build is complete for all deployed subjects
- Run one controlled data-sync operation to populate missing `trainer_projects` fields for all subjects with `product_id`:
  - backfill `system_prompt` from `products.system_prompt_deluxe` when blank,
  - backfill `exam_technique` from chunk data when blank,
  - backfill `staged_specifications` from normalized spec chunks when blank,
  - backfill deployment settings (`selected_features`, `exam_dates`, `essay_marker_marks`) from current live subject configurations where trainer row is empty,
  - backfill trainer profile fields where recoverable from existing trainer rows/default live setup.
- Keep custom sections empty if no trustworthy source exists (do not fabricate data).
- Ensure no subject ever gets another subject’s spec/fields during backfill.

5) Remove “hidden auto-persist” behaviors that conflict with Save lifecycle
- In `BuildPage`, stop immediate DB writes during feature toggle edits (currently selected features are partially persisted immediately).
- Keep edits local until Save is clicked, so dirty-state and save/deploy semantics remain consistent and predictable.

6) Add trainer-only `/build/about` page + entry button
- Create `BuildAboutPage` with a complete practical guide:
  - Edit -> Save -> Deploy lifecycle,
  - what Save does vs what Deploy does,
  - file upload behavior and processing,
  - accepted specification JSON formats with examples,
  - troubleshooting for “why changes are not live yet”.
- Restrict access with same trainer/admin role check used by Build.
- Add route in `App.tsx`: `/build/about`.
- Add button in Build header: “How do I use the training portal?” linking to `/build/about`.

7) Validation checklist (done before handoff)
- Open multiple subjects: no unsaved banner on initial load.
- Make one edit: banner appears; save clears it; deploy state updates correctly.
- Edexcel Maths spec JSON: valid shapes parse; invalid shape shows empty safely.
- Verify fields now load for each deployed subject:
  - Meet the Brain, system prompt, past papers visibility, custom sections, website deployment settings.
- Confirm no cross-subject data leakage when switching subjects.
- Confirm non-trainers cannot access `/build` or `/build/about`.

Files expected to change
- `src/pages/BuildPage.tsx` (major logic + hydration + dirty tracking + sync fallbacks + button)
- `src/components/SpecificationUploader.tsx` (robust JSON normalization/apply handling)
- `src/App.tsx` (new route)
- `src/pages/BuildAboutPage.tsx` (new trainer guide page)
- (If needed) small shared utility file for normalization helpers
- Database data updates (no schema change required unless we decide to persist save/deploy timestamps for cross-session deploy-state accuracy)

Notes on constraints/security
- Trainer access remains role-checked via `user_roles` (no client-side admin flags).
- No roles added to `users`/profile tables.
- Sync/backfill will be scoped by `product_id` and subject-board pairing to prevent incorrect cross-subject merges.
