## Goal

After every *substantive* assistant reply on the **Edexcel Economics** chatbot only (Free + Deluxe), render a polished footer block under the latest message containing:

1. **Spec point chip** — links into the spec/revision guide tool
2. **Recommended follow-up questions** — 3 chips, click to auto-send
3. **Related past paper questions** — 1–2 PEQ chips, click opens Past Paper Finder pre-filtered
4. **Streak nudge** — small flame badge ("🔥 5-day streak")

Footer only appears on the **latest** assistant message and only when the answer is substantive (≥200 chars and not a pure greeting/clarification). Older messages stay clean. **Zero changes to RAG behaviour, system prompt, or token usage** — exam-season-safe.

## Scope

- **Pages touched:** `FreeVersionPage.tsx` and `PremiumVersionPage.tsx` only (Edexcel Economics). All other bots untouched.
- **Component:** new `<AnswerFooter />` rendered inside `RAGChat` only when an opt-in prop `showAnswerFooter` is true.
- No DB schema changes. No edge function rewrites.

## Visual design

```text
┌── (assistant message body) ──────────────────────┐
│  …answer text…                                   │
│  👍 👎                                           │
├──────────────────────────────────────────────────┤
│  📘 Spec 2.2.1 — AD     🔥 5-day streak          │
│                                                  │
│  Recommended next:                               │
│   [ How does AD shift left? ]  [ Show diagram ]  │
│   [ Real-world AD example 2024 ]                 │
│                                                  │
│  Related past paper questions:                   │
│   [ Jun 2023 Q3 — 12 mark ]  [ Jun 2022 Q1b ]    │
└──────────────────────────────────────────────────┘
```

Subtle divider, condensed typography, chip buttons use `variant="outline" size="sm"` with hover lift. Streak chip is just text + flame, no card.

## How each block is sourced

| Block | Source | Cost |
|---|---|---|
| **Spec point** | Already streamed in the existing `metadataEvent` sources from `rag-chat`. Pick the top spec-type chunk's `metadata.spec_point` / `topic`. Fallback: hide. | Free (already fetched) |
| **Follow-ups (3)** | New tiny edge function `suggest-followups` — single Gemini 2.5 Flash call (~150 tokens out) given the user Q + first 800 chars of the answer. Cached per `messageId`. Fires *after* main stream completes so it never blocks the answer. | ~£0.0001/call |
| **Related PEQs** | Reuse existing Past Paper Finder search logic — query by the spec-point keyword against `document_chunks` where `content_type='past_paper_qp'`, take top 2. Same edge function returns these. | Free DB query |
| **Streak** | Existing `useStreak()` hook — read-only, no extra writes. | Free |

## Implementation steps

1. **New component** `src/components/AnswerFooter.tsx`
   - Props: `messageId`, `userQuestion`, `assistantAnswer`, `sources`, `onPromptClick(text)`, `onOpenSpec(point)`, `onOpenPastPaper(ref)`.
   - Internal: `useEffect` calls `suggest-followups` once per `messageId`; loading skeleton while pending; gracefully hides any sub-section that returns empty.

2. **New edge function** `supabase/functions/suggest-followups/index.ts`
   - Body: `{ productId, question, answer, specPoint? }`
   - Calls Lovable AI gateway (Gemini 2.5 Flash) with a strict JSON-only prompt: `{ followups: string[3], related_peqs: [{label, paper, year, qNum}] }`.
   - Past paper lookup via existing chunk search by topic keyword.
   - Returns within ~1.5s.

3. **`RAGChat.tsx` integration** (minimal)
   - Add prop `showAnswerFooter?: boolean`.
   - Inside the assistant message render block, after the feedback buttons, when `isLastAssistant && showAnswerFooter && !isAnimating && message.content.length >= 200`, render `<AnswerFooter ...>`.
   - `onPromptClick` reuses existing `submitMessage` path.
   - `onOpenSpec` / `onOpenPastPaper` open the existing sidebar tools (RevisionGuide / PastPaperFinder) via the existing toolbar dispatch pattern.

4. **Wire up only Edexcel Economics**
   - In `FreeVersionPage.tsx` and `PremiumVersionPage.tsx`: pass `showAnswerFooter` to `<RAGChat />`. Done.

5. **Substantive-answer gate** (in `AnswerFooter`)
   - Skip rendering if: answer < 200 chars, OR answer matches greeting/clarifier regex (`/^(hi|hello|sure|got it|of course)/i`), OR `sources.length === 0`.

## Safeguards (exam-season)

- Footer is purely additive — if `suggest-followups` fails or times out, the footer silently hides. Main chat untouched.
- Feature flag via the `showAnswerFooter` prop — if anything breaks, flip one boolean in two files to disable instantly.
- No changes to `rag-chat`, system prompt, RAG retrieval, streaming, persistence, or limits.

## Files

**New:**
- `src/components/AnswerFooter.tsx`
- `supabase/functions/suggest-followups/index.ts`

**Modified:**
- `src/components/RAGChat.tsx` (add prop + ~10-line render block)
- `src/pages/FreeVersionPage.tsx` (pass `showAnswerFooter`)
- `src/pages/PremiumVersionPage.tsx` (pass `showAnswerFooter`)

## Out of scope

- Other subjects (will roll out later once validated on Econ post-exam-season)
- Persisting follow-up suggestions to DB
- Changing the answer generation itself
