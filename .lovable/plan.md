## What you're describing is already live

The previous change to `src/components/RAGChat.tsx` (lines 171-179) already does exactly this for **every subject** — Edexcel Econ, AQA Econ, AQA Chem, AQA Psych, OCR Physics, OCR CS, Edexcel Maths, Edexcel Maths Applied, CIE Econ, and any future subject built through the Build portal.

### How it works (one place, applies everywhere)

Every chatbot — Free or Deluxe — renders through the shared `RAGChat` component and is fed `examDates` from `useTrainerConfig`, which reads the `exam_dates` JSONB array you set in the Build portal for that subject.

The countdown memo:

```ts
const sorted = [...examDatesProp].sort((a, b) => a.date - b.date);
const next = sorted.find(e => e.date >= today);   // skip past papers
if (!next) return null;                            // all done — hides countdown
return Math.round((next.date - today) / 86_400_000);
```

So for Edexcel Economics with Paper 1 = 11 May, Paper 2 = 18 May, Paper 3 = 4 June:

| Today is | Hero shows |
|---|---|
| 10 May | "1 day to go." (Paper 1) |
| 11 May | "Exam today." (Paper 1) |
| 12 May | "6 days to go." (auto-rolled to Paper 2) |
| 19 May | "16 days to go." (auto-rolled to Paper 3) |
| 5 June | hides countdown, falls back to "Let's get you that {grade}" |

The same logic applies to every other subject's exam dates — no per-subject branching, no code edits per subject. As long as each subject's Build portal has every paper listed in `exam_dates`, it rolls automatically.

### What you need to verify in Build (not code)

For this to roll correctly for **every** subject, each subject's Build portal entry must have **every paper** populated in `exam_dates`, not just Paper 1. If a subject only has Paper 1 listed, the countdown will hide the day after Paper 1 instead of rolling to Paper 2.

If you tell me which subject is missing later papers, I can add a one-off migration to backfill the Build portal `exam_dates` arrays from the hardcoded `ExamCountdown.tsx` constants (which already list every paper for AQA Econ, Edexcel Econ, AQA Chem, AQA Psych, OCR Physics, OCR CS, Edexcel Maths, CIE Econ).

### Out of scope

- No new logic — the auto-roll already shipped.
- No change to the sidebar exam calendar.
- No code change unless you confirm a specific subject's Build portal is missing papers.
