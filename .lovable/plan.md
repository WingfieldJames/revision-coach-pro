

## What's currently happening

The Essay Marker tool itself already submits via the normal chat (`onSubmitToChat` → `RAGChat.submitMessage` → `rag-chat` edge function). The "different API" behaviour is inside `supabase/functions/rag-chat/index.ts`, which detects marking requests and switches to a **different model** (`gemini-2.5-pro`) plus extra prompt directives.

## What to change

Single-file edit: `supabase/functions/rag-chat/index.ts`

1. **Remove model branching** — Always use `gemini-2.5-flash` (same as normal chat). Drop the Pro model selection.
   - Line 1185–1189: replace with `const aiModel = MODELS.fast;`
   - Line 1227–1234: remove the Pro→Flash fallback block (no longer needed since Flash is the only model).

2. **Remove marking-specific prompt logic** — Drop the `MARKING_PACING` directive injection so the system prompt is identical to normal chat.
   - Line 1129: delete the `MARKING_PACING` constant.
   - Line 1130–1131: simplify to `let finalSystemPrompt = PACING_DIRECTIVE + personalizedPrompt;` (no `isMarking` branch).

3. **Remove the `isMarkingRequest` helper** — No longer referenced after the above changes.
   - Lines 19–31: delete the function.
   - Lines 12–17: simplify `MODELS` to just keep `fast` and `utility` (drop `marking`).

4. **Keep the existing "ESSAY MARKING CAPABILITY" instructions block** (line 1134+) — this is just static guidance text appended to the system prompt for ALL chats and doesn't switch models or behaviour. It's part of the unified persona, so leaving it preserves marking quality without any branching.

## Files touched

- `supabase/functions/rag-chat/index.ts` — only file

## Out of scope (not touched)

- `EssayMarkerTool.tsx` — already routes through main chat; no changes needed.
- `mock-exam-mark` edge function — separate tool (mock exams), not the in-chat essay marker. User said "main chat for essay marking", so this stays as is.
- Frontend, DB, secrets — none required.

