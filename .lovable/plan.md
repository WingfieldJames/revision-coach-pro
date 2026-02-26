
Goal: make /build faithfully mirror what is currently live for every subject (legacy + dynamic), and stop false “unsaved changes” on initial load.

What I verified
- /build currently hydrates text/spec/custom from `trainer_projects` + `document_chunks`, but Past Papers only from `trainer_uploads` by `project_id`.
- Most legacy deployed subjects have `selected_features = []`, `exam_dates = []`, `essay_marker_marks = []`, empty trainer bio/image in `trainer_projects`, even though live pages enable tools via hardcoded `Header` props.
- Many legacy products have substantial past-paper chunks in `document_chunks` but zero `trainer_uploads`, so /build shows empty Past Papers.
- Unsaved banner is still race-prone because dirty tracking can run before hydration is fully “settled” across async child updates.

Implementation plan

1) Build a single “live config source of truth” map
- Add a shared mapping (legacy subject+board → features, exam dates, essay marker marks/label behavior, trainer bio fallback text).
- Use existing live page configs as canonical source (AQA Econ, OCR Physics, OCR CS, AQA Chem, AQA Psych, Edexcel Econ, Edexcel Maths, Edexcel Maths Applied, CIE Econ).
- Keep dynamic subjects sourced from `trainer_projects` first.

2) Extend data sync/backfill (data update + edge function)
- Upgrade `backfill-training-data` to also backfill if missing:
  - `selected_features`
  - `exam_dates`
  - `essay_marker_marks`
  - `trainer_description` (legacy fallback)
- Keep existing backfills (system prompt, exam technique, specs, custom sections).
- Add past-paper backfill logic:
  - For projects with no `trainer_uploads`, derive year/paper/doc-type groups from `document_chunks.metadata`.
  - Insert synthetic `trainer_uploads` rows (`processing_status='done'`, `section_type='past_paper'`, `chunks_created` from grouped counts, `year`, `doc_type`, `paper_number`, `file_name` like “Imported legacy paper …”).
- No schema migration required (data-only update).

3) Fix /build hydration so all live-relevant data appears
- In `BuildPage`, hydrate in this order:
  1. `trainer_projects`
  2. chunk/product fallbacks (already partly done)
  3. uploads (real + legacy-imported groups if needed)
- For past papers: render from hydrated uploads so each year card reflects deployed reality even for legacy subjects.
- For custom training data: surface non-standard imported content as “Custom Sections” only when not already represented by spec/exam-technique/past-paper.

4) Fix unsaved banner definitively
- Replace current ref timing with explicit `isHydrating` gate:
  - `isHydrating = true` before any state set
  - set all fields
  - compute and set final `savedSnapshot` from fully hydrated state
  - then `isHydrating = false`
- Dirty effect rule: `hasUnsavedChanges = !isHydrating && currentSnapshot !== savedSnapshot`.
- Add deep-equality guard in child callbacks (`onSpecDataChange`) to ignore no-op state writes.

5) Improve chunk viewer compatibility for legacy imports
- In `PastPaperChunkViewer`, keep existing upload-id queries.
- Add fallback query path for legacy imported rows using `(product_id + year + paper_number/doc_type)` matching metadata keys so reviewers can still inspect/edit chunks.

6) Validation checklist before handoff
- Open /build and switch all deployed subjects:
  - no unsaved banner on first load
  - system prompt, exam technique, spec, past papers, feature toggles, exam dates populated to match live behavior
- OCR Physics specifically:
  - My AI, essay marker (6-marker), past papers, exam countdown shown as selected
  - past-paper year cards populated from existing deployed chunks
- Save does not appear dirty immediately after load.
- Deploy button state remains correct with Save → Deploy workflow.

Files expected to change
- `src/pages/BuildPage.tsx`
- `src/components/PastPaperChunkViewer.tsx`
- `supabase/functions/backfill-training-data/index.ts`
- `supabase/config.toml` only if function config needs update
- optional shared config helper (legacy live feature map) in `src/lib/...`

Risk controls
- Backfill only when target field is empty to avoid overwriting trainer edits.
- Scope every sync by `project.product_id` and project’s own subject/board.
- Keep operation idempotent so reruns are safe.
