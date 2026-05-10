## Goal

Future-proof the chatbot hero countdown so it gracefully handles exam day and rolls forward to the next exam afterwards, across every subject.

## Current behaviour (`src/components/RAGChat.tsx`)

- `daysToFirstExam` (line 171) sorts `examDatesProp` ascending and uses index `[0]` regardless of whether it's already passed.
- Hero (line 1105) always renders `"{n} days to go."` — so "1 days to go." (bad grammar), "0 days to go." on exam day, and negative numbers the day after.

## Change (single component, applies to all subjects since every chatbot uses RAGChat)

1. **`daysToFirstExam` memo** — filter to the next exam that is today or later:
   - Compute `today` at midnight.
   - From sorted `examDatesProp`, pick the first entry where `date >= today`.
   - If none remain (all exams finished for the year), return `null` so the hero falls back to the existing "Let's get you that {grade}" line.
   - Return the day delta for that next upcoming exam.

2. **Hero label** (line 1105) — replace the hardcoded `"{n} days to go."` span with a small helper:
   - `n === 0` → "Exam today."
   - `n === 1` → "1 day to go."
   - `n > 1`  → "{n} days to go."
   
   Same `text-foreground` styling, same wrapping `<h2>`.

3. No schema, no per-subject branching — because each subject's `exam_dates` array already includes every paper in chronological order, the filter automatically advances to (e.g.) Edexcel Econ Paper 2 the day after Paper 1.

## Out of scope

- No changes to the Build portal exam date editor.
- No changes to the sidebar exam calendar (already handled separately per memory `exam-calendar-2026-v2-sidebar-only`).
- No copy changes to the "Your {subject} revision, sorted" subtitle.
