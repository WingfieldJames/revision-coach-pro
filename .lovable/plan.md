

The truncation footer already exists in `rag-chat` from the last change but it's possible: (a) the wording is too soft / not visible enough, (b) it's not firing reliably, or (c) `mock-exam-mark` doesn't have it at all. Let me verify.

Looking at current state:
- `rag-chat/index.ts` — has footer `"…(let me know if you'd like me to continue)"` when `finish_reason === "length"`. Italicised, easy to miss.
- `mock-exam-mark/index.ts` — NO truncation footer at all (it's not streaming, it returns JSON per question).

## Plan

**1. Make the rag-chat footer clearer and more actionable**

Change the appended footer from the soft italic line to a clear, bold question on its own line:

> `\n\n---\n\n**Want me to continue?** Just reply "continue" and I'll pick up where I left off.`

Same trigger (`finish_reason === "length"`), same streaming injection — just better wording so students actually notice and act on it.

**2. Add the same safety net to mock-exam-mark**

Currently `mock-exam-mark` parses JSON from the AI per question. If the AI's JSON gets truncated (finish_reason "length"), `JSON.parse` throws and the question silently shows "Marking error". 

Fix: detect `finish_reason === "length"` BEFORE parsing. If truncated, return a graceful result with feedback `"This answer was too long to mark in one pass — please retry this question."` instead of a parse error. (We don't offer "continue" here because marking is structured JSON, not conversational — retry is the right action.)

**3. No changes to max_tokens or pacing directive** — those are already set to 3500 + the silent pacing instruction from the previous change. This plan only fixes the *fallback* when pacing fails.

### Files to edit

- `supabase/functions/rag-chat/index.ts` — update truncation footer text (1 line change)
- `supabase/functions/mock-exam-mark/index.ts` — add `finish_reason` check before JSON.parse, return graceful retry message

No DB, no client, no secrets. Pure edge-function edit.

