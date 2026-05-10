## Goal

Make sure today's "My tip for today!" challenge shows for everyone using the A‑Level Edexcel Economics chatbot, and copy the exact same challenge into A‑Level AQA Economics.

## Current state (verified in DB)

- **Edexcel A-Level Economics** (`6dc19d53-...`) `active_challenge`:
  - title: "My tip for today!"
  - description: "Guys, can't believe we're finally here. Today's the last big push for paper 1…"
  - start: `2026-05-10T00:00:00Z`, end: `2026-05-12T23:59:59Z`
  - This challenge is stored on the trainer_project for that product, so every authenticated user opening the Edexcel Economics chatbot will load it via `RAGChat`'s `fetchChallenge` (no per-user gating exists). It is already visible for all Edexcel A-Level Economics users — no extra change needed there.

- **AQA A-Level Economics** (`17ade690-...`) `active_challenge`: still the older "past paper cycle" tip with dates 2026-04-20 → 2026-04-22 (expired).

## Change

Run a single data migration that overwrites AQA A-Level Economics' `active_challenge` JSONB with the exact same payload as Edexcel's current one (title, description, start, end, universal flag).

```sql
UPDATE public.trainer_projects
SET active_challenge = (
  SELECT active_challenge
  FROM public.trainer_projects
  WHERE product_id = '6dc19d53-8a88-4741-9528-f25af97afb21'
)
WHERE product_id = '17ade690-8c44-4961-83b5-0edf42a9faea';
```

After this, AQA A-Level Economics users will see the same notification dot + auto-popup on their next chatbot load, with identical wording and the 10–12 May active window.

## Out of scope

- No code changes. No schema changes. No edits to other subjects/boards (CIE, OCR keep their existing tips).
