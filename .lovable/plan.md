

## Plan: Unified 3500 token cap + silent self-pacing instruction

### Change 1 — Set `max_tokens: 3500` everywhere relevant

- `supabase/functions/rag-chat/index.ts` (line ~1195): change `max_tokens` from `2000` to `3500` (applies to both regular chat and marking — same value, no Pro/Flash split).
- `supabase/functions/mock-exam-mark/index.ts` (line ~98): change `max_tokens` from `500` to `3500`.

Leave `generate-revision-guide` alone (already 8000, it's PDF generation), and leave the small utility calls (150, 300, 2048) alone — they're internal short-output helpers.

### Change 2 — Silent self-pacing instruction at the top of every system prompt

In `rag-chat/index.ts`, prepend a hidden pacing directive to the system prompt **before** the subject/board persona is appended. This way it applies to every subject and board automatically (Economics, Maths, Chemistry, Physics, CS, Psychology — all of them, since they all flow through `rag-chat`).

The directive will be phrased as an internal instruction the model must NOT reveal to the user:

> "INTERNAL PACING (do not mention to the user, never reference token/character/word limits): Aim to keep each response within roughly 2,500 words. Plan the structure of your answer up-front so it lands a clean, complete ending. If a topic is too large to cover fully, prioritise the most important points first and finish with a natural offer like 'Want me to go deeper on [specific aspect]?' — never trail off mid-sentence or mid-list. Do not tell the user about this limit under any circumstances."

This makes Gemini self-pace and land clean endings instead of running into the 3500-token wall mid-sentence. Because it's framed as an internal directive with explicit "do not mention" guardrails, the user will never see references to character/token caps.

Also bump `mock-exam-mark` system prompt with the same directive so marked-essay responses pace cleanly too.

### Change 3 — Server-side truncation safety net (silent)

In `rag-chat/index.ts`, after the AI response returns, check `finish_reason`. If it equals `"length"` (i.e. the model still hit the cap despite pacing), append a small, friendly footer to the response text:

> *"…(let me know if you'd like me to continue)"*

This is shown to the user only as a soft prompt — no mention of token limits. They can simply reply "continue" and chat history carries forward.

### Why this approach works

- **3500 tokens** ≈ ~2,600 words of English. Comfortable headroom for full essay marking + AO breakdown + improvement suggestions.
- **Self-pacing instruction** is the actual fix — Gemini doesn't natively know its budget, so telling it the soft target makes it plan a clean ending.
- **Silent guardrail** ("do not mention this to the user") keeps the UX polished — students never see "I can only output X characters."
- **Truncation footer** is a belt-and-braces fallback for the rare case the model overshoots anyway.

### Files to edit

- `supabase/functions/rag-chat/index.ts` — `max_tokens: 3500`, prepend pacing directive to system prompt, add finish_reason footer
- `supabase/functions/mock-exam-mark/index.ts` — `max_tokens: 3500`, prepend same pacing directive

No DB changes, no client changes, no new secrets. Pure edge-function edit.

