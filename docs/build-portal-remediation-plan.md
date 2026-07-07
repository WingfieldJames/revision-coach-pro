# Build Portal (B2C) — Remediation Plan

**Status:** planning only — no code has been changed.
**Audience:** the executing model (Fable or Opus) that will implement this.
**Owner sign-off required** before any change to a Sacred file (see Ground Rules).

---

## 0. How to use this document

This is a self-contained implementation brief. Each **Workstream (WS)** below is independently
shippable and lists: objective, root cause, exact files/lines, the change to make (described, not
coded), acceptance criteria, and how to verify without a test runner. Implement in the numbered
order — later workstreams assume earlier ones landed. Do **one concern per commit**, atomic, with a
clear message (see CLAUDE.md).

Do **not** treat any line numbers here as current after you start editing — re-grep before each edit;
the file is ~2833 lines and shifts.

---

## 1. Ground rules (read before touching anything)

From `CLAUDE.md` and the codebase — these are hard constraints:

- **Sacred files — never edit without explicit per-change sign-off from the owner:**
  `src/lib/productAccess.ts`, `supabase/functions/stripe-webhook/**`,
  `supabase/functions/create-checkout/**`, `supabase/migrations/**` (add new timestamped files,
  **never edit an existing migration**), any RLS policy, `src/contexts/AuthContext.tsx`.
  None of the *code* fixes here touch those. Two workstreams need **new** migrations (WS-3 data
  clean-up, WS-8 grade-boundary + spec backfill) — those are new timestamped files but still need
  sign-off before running because they mutate production data (there is **no staging**; `main` is prod).
- **`deploy-subject` edge function is not on the sacred list** but it is billing-adjacent and
  production-critical. Present a diff and get a nod before applying (WS-6, WS-8).
- **No hardcoding** of prices, Stripe IDs, subject slugs, or A-Level grade assumptions. Read prices
  from `products`, qualification from `src/lib/qualification.ts`.
- **GCSE ≠ A-Level.** GCSE grades are **numbers (9, 8, 7, …)**; A-Level grades are **letters
  (A\*, A, B, …)**. Never render A-Level letters for a GCSE subject. Use `src/lib/qualification.ts`
  (`getGradeScale`, `getTopGrade`, `getTopGradeLabel`) — do not invent grade scales. This is a
  first-class correctness requirement of this plan, not cosmetic (see WS-7).
- British English in all user-facing copy (colour, optimise, organisation, behaviour).
- Student-facing copy: informal, punchy, spec/mark-scheme language.
- Tooling: `npm` (never `bun`). `npm run dev` (localhost:8080), `npm run lint`. **No test runner
  exists** — do not invent test commands; verification is manual + lint + type-check (see §5).
- `main` auto-deploys to production via Vercel (~60–90s). Land behind the flow, verify on a real
  built page.

---

## 2. Architecture context (why the portal is buggy)

The Build portal spreads one subject's data across **three storage layers**, and the split is the
root cause of most "inconsistency" complaints:

| Layer | Written by | Read by the public subject pages | Timing |
|---|---|---|---|
| `trainer_projects` (one row per subject) | Build **Save** (`handleSave`) | ✅ feature config read live, keyed on `product_id` | appears on **Save** |
| `products` (`system_prompt_deluxe`, pricing, `active`, slug) | Build **Deploy** (`deploy-subject` edge fn) | ✅ | appears on **Deploy** |
| `document_chunks` (specs, system prompt, exam technique, custom sections → RAG) | Build **Deploy** | ✅ via RAG / Revision Guide / Past-Paper tools | appears on **Deploy** |

Public read surfaces:
- `src/pages/DynamicFreePage.tsx`, `src/pages/DynamicPremiumPage.tsx` — read `products` by slug
  (`active=true`) then `trainer_projects` by `product_id` (`.maybeSingle()`).
- `src/components/RAGChat.tsx` — separately reads `trainer_projects.active_challenge` +
  `grade_boundaries_data` by `product_id`.
- `src/components/DynamicRevisionGuide.tsx`, `DynamicPastPaperFinder.tsx` — read `document_chunks`.

**Consequence:** feature config (toggles, exam dates, founder bio, prompts, diagrams, grade
boundaries, challenge) is live-on-Save; spec/prompt/RAG content is live-on-Deploy. Half the portal
reacts to Save, half to Deploy, with no signposting. That is the "inconsistency" users feel.

The long-term structural fix (WS-11) collapses this into one deployed source of truth. WS-1…WS-9 are
the pragmatic fixes that stop the bleeding without that rewrite.

---

## 3. Defect catalogue (evidence)

IDs are stable references used by the workstreams. Line numbers are as-found on the current `main`;
re-verify before editing.

### P0 — "it didn't save / content vanished"

- **B1 — Stale `projects` cache reverts saves on project switch.**
  `setProjects` runs only at initial load (`BuildPage.tsx:328`, deps `[hasAccess, user]`) and on
  create (`:684`). `handleSave` (`:748`), the image write (`:828`), and the universal-challenge loop
  (`:1602`) never refresh the in-memory `projects` array. The load effect (`:394–648`, deps
  `[selectedProjectId, projects]`) re-hydrates the whole form from `projects.find(...)` — the stale
  array. Save A → switch to B → back to A repaints **pre-save** values. Only a full reload
  (re-runs `loadProjects`) shows the truth. **Top suspect for "not saving."**

- **B2 — Baseline snapshot omits 6 tracked fields → permanent phantom "unsaved" + stuck section
  badges.** `currentFormSnapshot` (`:357–367`) tracks 20 keys incl. `trainerLinkedin`,
  `challengeTitle/Description/Start/End`, `gbData`. The post-hydration baseline (`:623–638`) omits
  exactly those 6. Different key sets → `JSON.stringify` never matches on load → `hasUnsavedChanges`
  is `true` before any edit, and `getSectionStatus` (`:376`) reads `undefined` for those fields so
  the **Challenge** and **Grade-Boundaries** panels show "unsaved" even right after a successful save.

- **B3 — Deploy-only content silently absent after Save.** Specs / system prompt / exam technique /
  custom sections reach the site only via Deploy → `document_chunks`
  (`deploy-subject/index.ts:200–351`). Save alone leaves the Revision Guide, Past-Paper Finder and
  chatbot training empty, with no warning. Save vs Deploy are loosely coupled with no UI signposting.

- **B4 — Hidden duplicate rows: edit one row, deploy/read another.** Load de-dupes
  `trainer_projects` by `qual::board::subject` keeping one "best" row (`:310–327`). If duplicates
  exist (CLAUDE.md notes Lovable creates these), you may edit the surfaced row while
  `deploy-subject` / the public `.eq('product_id', …)` resolves a different row. Edits appear to vanish.

### P1 — "feature content not loading on the main page"

- **B5 — Build-deployed spec chunks lack `metadata.topic` / `spec_id`.**
  `deploy-subject/index.ts:237` writes `{ content_type, type }` only. Readers
  `DynamicRevisionGuide.tsx:103–107` and `DynamicPastPaperFinder.tsx:131` use `metadata.topic` /
  `spec_id` as the primary label. Legacy ingesters (`ingest-maths-spec`, `ingest-chemistry-spec`)
  set them, so **legacy subjects render fine and every Build-portal subject silently degrades** — the
  Revision Guide parser falls back to string-parsing `content` and **drops** points matching overview
  keywords / JSON-looking / name < 3 chars (`DynamicRevisionGuide.tsx:143–153`).

- **B6 — Features render nothing when their data field is empty, with no hint.** Exam countdown
  hidden unless `examDates.length > 0` (`ChatbotToolbar.tsx:208`); `GradeBoundariesTool` returns
  `null` if numbers blank (`:72,:78–82`); founder bio hidden if description empty. Toggling a feature
  on without filling its data = invisible, no trainer-facing warning.

- **B7 — GCSE gates hide grade-boundaries & exam-countdown even when enabled.**
  `ChatbotToolbar.tsx:199` `show: showGradeBoundaries && !isGCSE`; `:208`
  `show: showExamCountdown && examDates.length > 0 && !isGCSE`. GCSE subjects lose these tiles
  regardless of the Build toggle; the Sidebar is inconsistent with the Toolbar
  (`ChatbotSidebar.tsx:489,:503`).

- **B8 — Unguarded `.maybeSingle()` on `product_id`; errors swallowed.**
  `DynamicFreePage:45`, `DynamicPremiumPage:51`, `RAGChat:487`. If >1 `trainer_projects` row shares a
  `product_id` (see B4), `.maybeSingle()` returns `null` + an ignored error → `trainer` null → all
  features/founder/dates fall to defaults with zero indication. Latent but total when it fires.

- **B9 — Trainer diagram images broken inside the Revision Guide.** Build stores `imagePath` as a
  raw private-bucket path (`BuildPage.tsx:2148`). `DiagramFinderTool.tsx:73` resolves via
  `getPublicUrl` (works — bucket made public in migration `20260320120040`), but
  `DynamicRevisionGuide.tsx:175–179` renders `![](rawPath)` and the PDF path prepends
  `window.location.origin` (`:326`) → broken `src`. Legacy static diagrams use public paths, masking it.

### P2 — races, dead code, resilience

- **B10 — Async `hydrateAsync` clobbers in-progress typing.** `BuildPage.tsx:534–645`, fired not
  awaited (`:647`); late `document_chunks` fetch calls `setSystemPrompt/…` over what the user typed
  (only when `trainer_projects` columns empty + `product_id` exists).
- **B11 — Diagram add is optimistic-only, never persisted.** `:2150` pushes to `diagramLibrary`
  state; persistence relies on a later manual Save. Switch project without saving → orphaned storage
  object, lost UI entry.
- **B12 — Universal-challenge broadcast racy & unreconciled.** `:1579–1628` serial per-row
  `.update` loop, no batching, no `projects` refresh; mid-loop failure half-applies; a later
  per-subject Save can overwrite it. `active_challenge` isn't in the pages' trainer select — only
  `RAGChat` (`:483`) reads it.
- **B13 — Threshold inconsistencies for custom sections.** Save marks submitted at `>= 10` chars
  (`:789`), Deploy client sends `> 20` (`:1150`), edge fn accepts `>= 10` (`deploy-subject:310`).
  Sections of 10–20 chars look saved but never deploy.
- **B14 — Swallowed errors mislead.** `handleAddText` toasts "Text added ✓" (`:999`) even if the
  `trainer_uploads` insert failed (`:988` only `console.error`s); `persistSubmissionState` and
  file-processing error updates never toast.
- **B15 — Dead / vestigial state (module drift).** `sectionStatuses` (`:178`, unused),
  `gradeBoundaries` (`:209`, shadows live `gbData`), `persistSubmissionState` (`:842`, never called),
  `specStatusFromUploader` (`:186`, never read), `*_submitted` states (`:190–200`, never read in
  render), `markUnsaved` (`:727`, no-op still called from `:914,:947,:998`).

### P1 (domain correctness) — GCSE grades

- **B16 — GCSE grade boundaries are stored under A-Level letter keys.** Storage always keys on
  `['A*','A','B']` (`BuildPage.tsx:222–224,:499–515,:505,:780,:2052`; `GradeBoundariesTool.tsx:75`),
  and a display map `A*→9, A→8, B→7` (`GradeBoundariesTool.tsx:38–43,:91–97`;
  `BuildPage.tsx:2053`) fakes numeric labels for GCSE. It *renders* correctly today but:
  - the data model is wrong — a GCSE "grade 9" boundary literally lives under a DB key named `A*`;
  - it is capped at 3 grades (9/8/7) — cannot express grade 6/5/4;
  - any raw consumer of `grade_boundaries_data` (analytics, RAG, exports) sees `A*` for a GCSE subject.
  Your instruction ("use 9, 8, 7 for GCSE") requires making GCSE numeric **end to end**, not just in
  the label layer. Covered by WS-7.

---

## 4. Workstreams (implementation order)

Each WS: **Objective / Root cause refs / Files / Change (described) / Acceptance / Verify / Risk**.

> Legend: 🟢 client-only, no migration • 🟡 edge function • 🔴 needs new migration + owner sign-off.

---

### WS-0 — Diagnostics (do first, read-only) 🟢
**Objective:** quantify how much pain is data vs code before changing anything.
**Change:** run read-only SQL against production (via a service-role edge context or the Supabase
SQL editor — do not embed service-role keys in `src/`). Capture counts for:
1. Duplicate `trainer_projects` per `(qualification_type, exam_board, subject)` — feeds B4/B8.
2. `product_id` values shared by >1 `trainer_projects` row — the exact B8 trigger.
3. `products` rows with `active=true` whose linked `trainer_projects` row is null/missing.
4. Spec chunks (`metadata->>content_type='specification'`) missing `metadata.topic` — feeds B5/WS-6.
5. `grade_boundaries_data` present on GCSE subjects (keyed under `A*/A/B`) — feeds B16/WS-7 backfill sizing.
**Acceptance:** a short findings note (counts) attached to the PR/commit that opens the work.
**Verify:** queries return without error; numbers recorded.
**Risk:** none (read-only). **Do not** run mutations here.

---

### WS-1 — Fix stale `projects` cache (B1) 🟢
**Objective:** a successful Save must be reflected in the in-memory `projects` array so switching
projects never reverts to pre-save data.
**Files:** `src/pages/BuildPage.tsx`.
**Change (described):**
- After a successful `handleSave` (`~:795`), patch the matching entry in `projects` state with the
  exact fields just written (system_prompt, exam_technique, custom_sections, trainer_*, selected_features,
  exam_dates, essay_marker_marks, staged_specifications, suggested_prompts, diagram_library,
  active_challenge, grade_boundaries_data, the three `*_submitted` booleans, and `updated_at`). Use a
  functional `setProjects(prev => prev.map(p => p.id === projectId ? { ...p, ...written } : p))`.
- Do the same after the immediate trainer-image write (`~:828`) and after the universal-challenge
  loop (WS-4 will also touch this) so the cache never drifts from the DB.
- Preferred hardening: extract a single `writtenFields` object used both for the DB `.update` and the
  cache patch, so they cannot diverge (also helps WS-2).
**Acceptance:** Save project A → switch to B → back to A shows saved values with **no reload**.
**Verify:** manual, on `npm run dev`: edit a field, Save, switch project, return; confirm value
persists. Confirm no console errors.
**Risk:** low. The load effect re-runs when `projects` changes (dep at `:648`) — ensure the patch
does not race the load effect into wiping unsaved edits; guard with the existing `hydrationDoneRef`
pattern and only patch on the *saved* fields.

---

### WS-2 — Single source of truth for the dirty snapshot (B2) 🟢
**Objective:** eliminate phantom "unsaved" state and stuck section badges by making the current and
baseline snapshots structurally identical.
**Files:** `src/pages/BuildPage.tsx`.
**Change (described):**
- Introduce one pure helper, e.g. `buildSnapshot(state)`, that serialises **all** tracked fields in a
  fixed key order. Use it for both `currentFormSnapshot` (`:357`) and the post-hydration baseline
  (`:623`). The baseline currently omits `trainerLinkedin`, `challengeTitle`, `challengeDescription`,
  `challengeStart`, `challengeEnd`, `gbData` — the helper guarantees parity.
- After Save (WS-1) and Deploy, set `savedSnapshot = buildSnapshot(currentState)` via the same helper.
- Confirm `getSectionStatus` (`:376`) now finds defined values for Challenge and Grade-Boundaries.
**Acceptance:** loading an untouched, already-saved project shows **no** "unsaved changes" and every
section badge reads "saved"/"deployed" (not "unsaved"). Editing any tracked field flips only that
section to "unsaved".
**Verify:** manual. Load a saved subject → the global save indicator and all badges are clean. Toggle
one grade-boundary number → only Grade-Boundaries goes "unsaved".
**Risk:** low; purely local state logic.

---

### WS-3 — De-duplicate `trainer_projects` (B4, B8 root) 🔴
**Objective:** guarantee one `trainer_projects` row per subject and per `product_id`, so edits,
deploys and public reads all resolve the same row.
**Files:** **new** `supabase/migrations/<timestamp>_dedupe_trainer_projects.sql`; possibly a small
change to `handleCreateProject` (`BuildPage.tsx:651`) to also check the DB (not just the de-duped
in-memory list) before insert.
**Change (described):**
- Migration: merge duplicates — keep the "best" row per `(qualification_type, exam_board, subject)`
  using the same precedence the client uses (deployed > has `product_id` > most recently updated,
  `:319–325`), re-point any dependent rows, delete the losers, then add a **partial/unique
  constraint** (or unique index) that prevents future duplicates on that tuple **and** a unique
  constraint on `product_id` (where not null).
- Client: strengthen `handleCreateProject` duplicate check to query the DB, since the in-memory list
  is de-duped and cannot see hidden rows.
**Acceptance:** WS-0 duplicate counts drop to 0; a second insert of the same subject is rejected /
routed to the existing row.
**Verify:** re-run WS-0 queries #1 and #2 → both zero. Attempt to create a duplicate subject in the
UI → routed to the existing one (existing behaviour at `:660`).
**Risk:** **high — production data mutation, no staging.** Requires owner sign-off. Take a backup /
export of `trainer_projects` first. Write the migration to be idempotent and reversible where
possible. This is a prerequisite for WS-5's `.maybeSingle()` safety being fully sound, but WS-5 also
adds a defensive fix so they are independently valuable.

---

### WS-4 — Universal-challenge correctness (B12) 🟢
**Objective:** make the "apply challenge to all subjects" action atomic-ish, reconciled with local
state, and consistent with the public read path.
**Files:** `src/pages/BuildPage.tsx` (`:1579–1628`); confirm read path in `RAGChat.tsx:478–521`.
**Change (described):**
- Replace the serial `for`-loop of per-row `.update`s with a single batched update (e.g. update all
  eligible IDs in one statement / RPC) so it is not N round-trips and cannot half-apply.
- After the broadcast, refresh the `projects` cache (dovetails with WS-1) and reconcile the current
  project's local challenge fields + snapshot (WS-2) so a subsequent per-subject Save doesn't clobber
  the broadcast.
- Decide and document the precedence: subject-specific challenge overrides universal (already the read
  logic in `RAGChat:482–500`). Ensure Build's "eligible to overwrite" rule (`:1598–1601`) matches.
**Acceptance:** setting a universal challenge shows it on every subject that has no subject-specific
override, survives a project switch, and is not silently overwritten by the next Save.
**Verify:** set a universal challenge → open two subject pages → both show it (within its date
window) → edit one subject's other fields and Save → challenge still present.
**Risk:** medium; touches multi-row writes. No schema change.

---

### WS-5 — Harden public reads (B8) 🟢
**Objective:** a stray duplicate or transient error must never blank an entire subject page.
**Files:** `src/pages/DynamicFreePage.tsx:45`, `src/pages/DynamicPremiumPage.tsx:51`,
`src/components/RAGChat.tsx:487`.
**Change (described):**
- Replace bare `.eq('product_id', prod.id).maybeSingle()` with a deterministic
  `.eq('product_id', prod.id).order('updated_at', { ascending: false }).limit(1).maybeSingle()` (or
  `.limit(1)` + take `[0]`), so multiple rows can't throw and null out `trainer`.
- Surface read errors: if the trainer query errors, log and fall back to defaults **and** (dev only)
  make it visible; do not silently render an all-default page. Keep the student-facing page graceful.
**Acceptance:** even with a duplicate present, the subject page renders its real features.
**Verify:** manual against a subject; if WS-0 found a dup, test against it before WS-3 cleans it.
**Risk:** low.

---

### WS-6 — Spec chunk metadata parity (B5) 🟡 (+ 🔴 backfill in WS-8)
**Objective:** Build-portal subjects must get the same `metadata.topic` / `spec_id` that legacy
ingesters produce, so the Revision Guide and Past-Paper Finder render full spec-point lists.
**Files:** `supabase/functions/deploy-subject/index.ts:200–258` (spec chunk build);
reference `supabase/functions/ingest-maths-spec/index.ts` and `ingest-chemistry-spec/index.ts` for
the exact `topic`/`spec_id` shape the readers expect.
**Change (described):**
- When building spec-chunk rows (`:232–239`), parse each spec point into a code/`spec_id` and a
  `topic` label (mirror the legacy ingesters' extraction), and include them in `metadata`.
- Keep `content_type: "specification"` unchanged so existing filters still match.
**Acceptance:** a freshly deployed Build-portal subject shows a complete spec-point list in the
Revision Guide (no silently dropped points) and sensible labels in the Past-Paper Finder.
**Verify:** deploy a test subject with a known spec → open `/s/<slug>/free` → Revision Guide lists
every point; compare count to input.
**Risk:** medium; edge function change, present diff for sign-off. Existing legacy subjects
unaffected (they were ingested by the dedicated functions). New subjects get correct metadata;
existing Build-portal subjects need the WS-8 backfill.

---

### WS-7 — GCSE grades numeric end-to-end (B7, B16) 🟢 (+ 🔴 backfill in WS-8)
**Objective:** GCSE subjects use **numeric grades (9, 8, 7, …)** as the actual data model and in every
surface; A-Level uses **letters (A\*, A, B, …)**. Remove the "GCSE stored under A-Level letter keys"
hack and the `!isGCSE` gates that hide GCSE tiles.
**Files:** `src/pages/BuildPage.tsx` (`:222–224,:499–515,:505,:773–788,:780,:2052–2053,:2090–2112`),
`src/components/GradeBoundariesTool.tsx` (`:38–43,:75,:85,:88,:91–97`),
`src/components/ChatbotToolbar.tsx` (`:199,:208`), `src/components/ChatbotSidebar.tsx` (`:489,:503`),
and `src/lib/qualification.ts` (source of grade scales — extend if needed, do not hardcode elsewhere).
**Change (described):**
1. **Grade set from qualification, not hardcoded.** Derive the grade keys from
   `qualification.ts` for the project's `qualification_type`: GCSE → the numeric top grades you want to
   capture (recommend `['9','8','7']`, extensible), A-Level → `['A*','A','B']`. Replace every hardcoded
   `['A*','A','B']` in BuildPage's grade-boundary state init, load, save, and render with this derived
   set. Add a `getGradeBoundaryGrades(qualLevel)` helper to `qualification.ts` (or reuse
   `getGradeScale` sliced to the top three) so there is one source of truth.
2. **Store under real grade keys.** `grade_boundaries_data` must key on the actual grade for the
   qualification: GCSE rows keyed `"9"/"8"/"7"`, A-Level keyed `"A*"/"A"/"B"`. Remove
   `GCSE_LABEL_MAP` and the display-remap in `GradeBoundariesTool` (`:38–43,:91–97`) — display key ==
   storage key once data is correct.
3. **Read/write/predict all use the derived keys.** Update `handleSave`'s grade-boundary serialiser
   (`:773–788`), the load hydration (`:496–517`), and the 2026 linear-extrapolation loops
   (`BuildPage.tsx:2090`, `GradeBoundariesTool.tsx:45–68,:88`) to iterate the derived key set.
4. **Remove GCSE tile gating.** Delete the `!isGCSE` conditions in `ChatbotToolbar.tsx:199` (grade
   boundaries) and `:208` (exam countdown) so enabling those features in Build works for GCSE.
   Reconcile Sidebar (`:489,:503`) so Toolbar and Sidebar behave identically for GCSE.
5. **Colours/labels.** `GradeBoundariesTool` already has `GCSE_COLORS`/`A_LEVEL_COLORS`; drive them
   off the derived key set, not the letter map.
**Acceptance:** for a GCSE subject the Build grade-boundary grid shows **9 / 8 / 7** headers writing to
`grade_boundaries_data["9"|"8"|"7"]`; the public Grade-Boundaries tool shows numeric grades and is
**visible** on GCSE; A-Level subjects still show A\*/A/B. No `A*` key exists in a GCSE subject's stored
data.
**Verify:** create/inspect one GCSE and one A-Level subject; enter boundaries; check the stored JSON
(WS-0 query style) uses numeric keys for GCSE; confirm the public tiles render and the 2026 prediction
computes for both.
**Risk:** medium. Existing GCSE subjects have data under `A*/A/B` keys — they render via the old map
until backfilled (WS-8). To avoid a gap, either (a) ship WS-7 + WS-8 together, or (b) keep a temporary
read-time compatibility shim (map legacy `A*/A/B`→`9/8/7` on read only) and remove it after WS-8.
Recommend (a).

---

### WS-8 — Data backfills (B5, B16) 🔴
**Objective:** bring existing production data up to the new shapes from WS-6 and WS-7.
**Files:** **new** migration(s) or a one-off service-role script (edge function / `scripts/` run with
service-role env, never client). Two backfills:
1. **Spec metadata (WS-6):** for existing Build-portal products, re-derive `metadata.topic`/`spec_id`
   on `specification` chunks. If deriving from stored `content` is unreliable, the cleaner path is to
   re-run Deploy for those subjects after WS-6 lands (Deploy already deletes+rewrites spec chunks,
   `deploy-subject:210–215`) — document which subjects need re-deploy.
2. **GCSE grade keys (WS-7):** rename keys in `grade_boundaries_data` for GCSE subjects
   `A*→9, A→8, B→7`. Idempotent; only touch rows whose `qualification_type='GCSE'`.
**Acceptance:** WS-0 queries #4 and #5 show zero legacy-shaped rows remaining.
**Verify:** re-run the WS-0 queries; spot-check one migrated GCSE subject's page.
**Risk:** **high — production data, no staging, owner sign-off, backup first.** Prefer re-deploy over
in-place chunk rewriting for #1 where feasible (less error-prone). Make #2 a pure key-rename that is
safe to run twice.

---

### WS-9 — Feature "enabled but empty" guidance + Save/Deploy signposting (B3, B6) 🟢
**Objective:** stop silent empty features; make the Save-vs-Deploy contract explicit.
**Files:** `src/pages/BuildPage.tsx` (feature toggles + deploy banner region),
`src/components/ChatbotToolbar.tsx`, `src/components/ChatbotSidebar.tsx`, `GradeBoundariesTool.tsx`.
**Change (described):**
- In Build, when a feature is toggled on but its backing data is empty (exam countdown w/o dates,
  grade boundaries w/o numbers, founder w/o bio, diagrams w/o images), show a clear inline warning
  ("This feature is on but has no content — students will see nothing until you add …").
- Add a persistent banner for deployed subjects with unsaved-since-deploy or saved-not-deployed state:
  "Saved as draft. Students won't see spec / chatbot changes until you Deploy." Wire it to the existing
  `hasSavedChangesSinceDeploy` / `projectStatus` state (`:277,:403–410,:799`).
- Copy in British English, informal/punchy.
**Acceptance:** a trainer cannot enable a feature and leave the site silently blank without seeing a
warning; the Save/Deploy distinction is visible.
**Verify:** toggle each feature on with empty data → warning shows; Save without Deploy → banner shows.
**Risk:** low; copy + conditional UI.

---

### WS-10 — Resilience & clean-up (B9, B10, B11, B13, B14, B15) 🟢
**Objective:** close the remaining races, broken assets, misleading toasts, and delete dead state.
**Files:** `src/pages/BuildPage.tsx`, `src/components/DynamicRevisionGuide.tsx`.
**Changes (described), each its own commit:**
- **B9:** In `DynamicRevisionGuide.tsx` resolve diagram `imagePath` via
  `supabase.storage.from('trainer-uploads').getPublicUrl(path)` (mirror `DiagramFinderTool.tsx:73`)
  for both on-screen render (`:175–179`) and the PDF path (`:326`, stop prepending
  `window.location.origin`).
- **B10:** In `hydrateAsync` (`:534–645`) don't overwrite a field the user has already edited — guard
  each `setState` so it only applies to still-empty fields (compare against current state or a
  "user-touched" ref) before setting.
- **B11:** Persist a newly added diagram immediately (write `diagram_library` to the row on add,
  `~:2150`) or block navigation/warn if unsaved; avoid orphaned storage objects.
- **B13:** Define one shared minimum-length constant for custom sections and use it in `handleSave`
  (`:789`), the deploy payload filter (`:1150`), and `deploy-subject:310` (edge fn value must match).
- **B14:** Make toasts honest — `handleAddText` (`:988–999`) must not claim success when the insert
  failed; surface `persistSubmissionState` / file-processing errors to the user.
- **B15:** Delete dead state: `sectionStatuses` (`:178`), `gradeBoundaries` (`:209`),
  `persistSubmissionState` (`:842`), `specStatusFromUploader` (`:186`), unused `*_submitted` reads,
  and the `markUnsaved` no-op (`:727`) + its call sites (`:914,:947,:998`). Verify each is truly
  unreferenced before removing.
**Acceptance:** diagrams render in the Revision Guide + PDF; typing during load isn't wiped; added
diagrams survive a project switch; thresholds consistent; no false-success toasts; lint clean with no
unused vars.
**Verify:** manual per bullet + `npm run lint`.
**Risk:** low, but B15 removals must be grep-verified to avoid breaking a hidden reference.

---

### WS-11 — Structural fix: one deployed source of truth (optional, larger) 🔴
**Objective:** end the split-brain so "Save = draft, Deploy = live" is true for **every** field, not
half.
**Change (described):** have `deploy-subject` snapshot the full feature config (currently read live
from `trainer_projects`) into a deployed, versioned config the public pages read from — so unpublished
edits never leak to students and everything publishes atomically on Deploy. Public pages read a single
deployed source instead of live `trainer_projects`.
**Acceptance:** editing + Save never changes the live student page; Deploy publishes all changes at
once.
**Risk:** high; schema + read-path rewrite; do only after WS-1…WS-10 stabilise. Treat as a separate
project with its own plan and sign-off.

---

## 5. Verification strategy (no test runner exists)

- **Type + lint gate every change:** `npm run lint` and a TypeScript check (`tsc`/editor) must be
  clean. Do **not** invent `npm test`.
- **Manual flow verification** on `npm run dev` (localhost:8080) for each WS's "Verify" steps. Use the
  `/verify` or `/run` skills to drive the real app where useful.
- **Two canonical subjects**: keep one **A-Level** and one **GCSE** test subject and re-run the full
  build → save → deploy → view `/s/:slug/free` and `/premium` loop after each workstream. GCSE is the
  regression-prone one (grades, tile gating).
- **Data assertions** via the WS-0 read-only queries after WS-3 and WS-8.
- **Production caution:** `main` is prod and auto-deploys. Land small, verify on the built page within
  ~90s, be ready to revert a commit.

---

## 6. Suggested sequencing & dependencies

```
WS-0 (diagnostics)
  └─> WS-1 (stale cache)      ─┐
  └─> WS-2 (snapshot parity)  ─┤ P0 client fixes — ship first, biggest relief
  └─> WS-5 (read hardening)   ─┘
WS-3 (dedupe migration)  [sign-off]  ── removes B4/B8 at the source
WS-4 (universal challenge)
WS-6 (spec metadata, edge fn) [sign-off] ─┐
WS-7 (GCSE numeric grades)               ─┤ ship together with…
WS-8 (backfills) [sign-off]              ─┘ …to avoid a data-shape gap
WS-9 (empty-feature + save/deploy signposting)
WS-10 (resilience + dead-code cleanup)
WS-11 (structural, optional/later) [sign-off]
```

**Fastest user-visible win:** WS-1 + WS-2 (pure client, no migration) fix the loudest "it didn't
save / it says unsaved forever" complaints. Do those first, then the GCSE correctness bundle
(WS-6/7/8) since the owner explicitly flagged numeric grades.

---

## 7. Owner decisions still needed

1. **GCSE grade depth (WS-7):** capture only top three (9/8/7), or extend to more grades (6/5/4…)?
   The plan makes the grade set config-driven so either is a one-line change, but pick a default.
2. **Save/Deploy model (WS-9 vs WS-11):** short-term signposting now, or commit to the structural
   single-source-of-truth rewrite?
3. **Backfill method for spec metadata (WS-8 #1):** re-run Deploy per affected subject (safer) vs
   in-place chunk rewrite (faster). Recommend re-deploy.
4. **Migration sign-off (WS-3, WS-8):** confirm before running anything against production; take a
   backup first.
