

## Plan: Easter Challenge 2 + Modular Challenge System + Grade Boundaries Builder + Emoji Cleanup

### Overview

Five changes: (1) Replace hardcoded challenge with a modular, database-driven challenge system configurable from Build, (2) Easter Challenge 2 content for the next 3 days, (3) Grade boundaries data entry in Build, (4) Post-submission feedback/reflection field in challenge popup, (5) Remove emojis from past paper finder free-version subtext.

---

### Technical Details

#### 1. Database: Add challenge config to `trainer_projects`

Add two new columns to `trainer_projects` via migration:
- `active_challenge` (jsonb, nullable, default null) — stores the current challenge config:
  ```json
  {
    "title": "Easter Challenge 2",
    "description": "So we've tried a paper 1 together...",
    "start": "2026-04-09T00:00:00Z",
    "end": "2026-04-12T00:00:00Z"
  }
  ```
- `grade_boundaries_data` (jsonb, nullable, default null) — stores actual grade boundary percentages:
  ```json
  {
    "2023": { "A*": 81.5, "A": 73.1, "B": 63.0 },
    "2024": { "A*": 83.0, "A": 74.9, "B": 64.5 },
    "2025": { "A*": 85.7, "A": 78.2, "B": 67.8 }
  }
  ```
  2026 predicted values are auto-calculated via linear extrapolation from the 3 years.

#### 2. Build Page — Challenge Section

Add a new "Challenges" section in the Build portal (below features or as a new card):
- Title input
- Description textarea
- Start date + End date pickers
- Save button that writes to `trainer_projects.active_challenge`
- This is universal — same challenge applies to all subjects. The challenge config will be read by the chatbot at runtime.

#### 3. Build Page — Grade Boundaries Data Entry

Replace the current placeholder text in the Grade Boundaries config section with actual input fields:
- 3 rows (2023, 2024, 2025) x 3 columns (A*, A, B) = 9 number inputs
- "2026 (Predicted)" row auto-calculated and displayed read-only
- Save to `trainer_projects.grade_boundaries_data`
- The `GradeBoundariesTool` component will read from DB instead of hardcoded values

#### 4. ChallengePopup — Make Dynamic + Add Reflection

Refactor `ChallengePopup.tsx`:
- Remove all hardcoded dates, titles, text, and grade boundaries
- Accept challenge config (title, description, start, end) as props from `RAGChat`
- `isChallengeActive()` reads from the DB-driven config instead of hardcoded dates
- After score submission, show the grade result AND a new textarea: "Tell me what went wrong — what topics tripped you up?" with a submit button
- The reflection text saves to `user_preferences.additional_info` alongside the score
- Grade boundaries for mapping come from `trainer_projects.grade_boundaries_data` (fetched in RAGChat and passed down), falling back to the existing hardcoded defaults

#### 5. RAGChat — Fetch Challenge Config

- On mount, fetch `active_challenge` and `grade_boundaries_data` from `trainer_projects` for the current product
- Pass challenge config to `ChallengePopup` as props
- `showChallengeMode` logic uses the DB dates instead of `isChallengeActive()`
- localStorage keys include a challenge identifier (e.g. title hash) so different challenges don't collide
- New users (no preferences) still see "Fill me in" first

#### 6. Past Paper Finder — Remove Emojis

In `DynamicPastPaperFinder.tsx` and `PastPaperFinderTool.tsx`:
- Remove 📚 emoji from the free-version subtext lines

#### 7. Initial Data: Easter Challenge 2

Set the initial challenge via the Build page or directly in DB:
- Title: "Easter Challenge 2"
- Description: "So we've tried a paper 1 together. Now exact same drill with Paper 2. Try it timed conditions, no notes and let me know what you get."
- Start: 2026-04-09, End: 2026-04-12

---

### Files Modified

| File | Change |
|---|---|
| `supabase/migrations/` | Add `active_challenge` and `grade_boundaries_data` columns to `trainer_projects` |
| `src/components/ChallengePopup.tsx` | Make fully dynamic (props-driven), add reflection textarea post-submission |
| `src/components/RAGChat.tsx` | Fetch challenge config + grade boundaries from DB, pass to ChallengePopup |
| `src/pages/BuildPage.tsx` | Add Challenges section (title/description/dates) + Grade Boundaries data entry inputs |
| `src/components/GradeBoundariesTool.tsx` | Read from DB data instead of hardcoded, auto-calculate 2026 |
| `src/components/DynamicPastPaperFinder.tsx` | Remove 📚 emoji from free subtext |
| `src/components/PastPaperFinderTool.tsx` | Remove 📚 emoji from free subtext |

