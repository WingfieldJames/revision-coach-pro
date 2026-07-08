# A*AI — Content Training & RAG Pipeline Audit

Read-only audit of how subjects are ingested, chunked, embedded, retrieved, and fed to the model. Focus: is content analysed optimally, and where does retrieval/answer quality break down.

## TL;DR

The single most important finding: **this is not actually a RAG system in the semantic sense.** Full vector infrastructure exists (pgvector, an ivfflat index, a `match_documents` RPC, embeddings generated on ingest with `text-embedding-3-small`/1536-dim), but the live chat retrieval path **never generates a query embedding and never calls `match_documents`.** Retrieval is naive keyword substring counting. Embeddings are written on every deploy at cost + latency and then never read. On top of that, the main chat retrieval silently caps at 1000 chunks per product, the AI diagram matcher is dead code (`MODELS.main` is undefined), and marking — the accuracy-critical task — runs on the cheapest chat model with no automated quality metric.

Below, findings are ranked by severity with file:line evidence, a concrete failure scenario, and the recommended fix.

---

## CRITICAL

### C1. Retrieval is keyword substring matching, not semantic search. All embeddings are dead weight.
**Severity: Critical**

- Evidence:
  - `supabase/functions/rag-chat/index.ts:411-423` — `scoreChunkByKeywords` scores by `text.split(kw).length - 1` (raw substring frequency over `content + JSON.stringify(metadata)`).
  - `rag-chat/index.ts:444-447` — retrieval is `supabase.from('document_chunks').select('content, metadata').eq('product_id', productId)` then in-memory keyword scoring (`retrieveWithAIQueries` / `retrieveWithKeywords`). No `query_embedding`, no `match_documents`, no `<=>` anywhere in the file.
  - Vector infra that exists but is unused: `supabase/migrations/20260115114606_*.sql:9` `embedding vector(1536)`, `:15-16` ivfflat index, `:32-59` `match_documents(query_embedding, match_count, filter_product_id)` RPC.
  - Embeddings ARE produced on write: `deploy-subject/index.ts:9-34,224-240` (`text-embedding-3-small`), also `ingest-documents`, `ingest-school-material`, `process-training-file` all embed. `ingest-content`, `ingest-chemistry-*`, `ingest-physics-*` insert `embedding: null`.
- Scenario: A student asks "why would a central bank raise rates to cool the economy?" The spec/notes phrase it as "contractionary monetary policy" and "tightening". Keyword overlap is near zero ("central", "bank", "raise", "rates" vs "monetary", "policy", "tightening"), so the most relevant chunks score 0 and are dropped, while an unrelated chunk that happens to contain "economy" three times wins. Semantic search would retrieve the monetary-policy chunk instantly.
- Why it matters: no synonym/paraphrase handling, no conceptual match, ranking dominated by term frequency and chunk length. This is the root cause of most "the bot ignored the spec" quality complaints.
- Fix (optimal): make retrieval actually vector-based. Embed the user query (or the AI-generated search queries) with the same `text-embedding-3-small`, call `match_documents` with `filter_product_id`, and use cosine similarity as the base score. Keep the keyword score and the past-paper recency bonus as *re-rank* signals on top of the vector candidate set (hybrid search). This reuses infra already paid for. If you keep it lexical, at least move to Postgres full-text search (`tsvector`/`ts_rank`) with an index rather than pulling every row into a Deno function.

### C2. Main chat retrieval silently truncates at 1000 chunks per product.
**Severity: Critical (silent, data-dependent)**

- Evidence: `rag-chat/index.ts:444-447` — the chat retrieval `select(...).eq('product_id', productId)` has **no `.limit()` and no `.range()`**, so it is bound by PostgREST's default max-rows (1000 on Supabase). Contrast `rag-chat/index.ts:984` (`search_only` path) which explicitly uses `.limit(5000)`, and `suggest-followups/index.ts:113` (`.limit(1500)`).
- Scenario: Edexcel Economics or any subject with full past papers easily exceeds 1000 question/mark-scheme chunks. The chat only ever sees the first 1000 rows in arbitrary DB order; every chunk beyond that is unreachable from chat, regardless of relevance. A student asking about a topic whose chunks happen to sit past row 1000 gets "I don't have that in my materials."
- Fix: if you move to `match_documents` (C1), this disappears (ranking + LIMIT happen in Postgres). If you keep in-memory scoring as an interim, paginate with `.range()` to pull all rows, or push scoring into SQL. Never rely on the implicit 1000 cap for a correctness-sensitive read.

### C3. AI diagram matcher is broken — `MODELS.main` is undefined.
**Severity: High**

- Evidence: `rag-chat/index.ts:13-16` defines `MODELS = { fast, utility }` only. `rag-chat/index.ts:141` calls the diagram matcher with `model: MODELS.main` → `undefined`. The Lovable gateway rejects an undefined model; the `try` fails and control falls to the naive keyword fallback at `:212-220`.
- Scenario: The ~200-line precision system prompt at `:143-186` exists specifically to stop false matches like "negative output gap" → negative-externality diagram. Because the AI call never succeeds, that prompt is never used; the fallback is exactly the partial-word substring match it was written to prevent. So students asking about output gaps can get an externality diagram, and many valid concepts get no diagram.
- Fix: change `:141` to `MODELS.fast` (or add a `main` alias). Then verify diagram quality against the prompt's own rules.

---

## HIGH / METADATA DRIFT

### H1. `deploy-subject` spec chunks carry no `topic`, `spec_id`, `section`, or `year` — unlike legacy ingesters.
**Severity: Medium-High**

- Evidence: `deploy-subject/index.ts:237` writes `metadata: { content_type: "specification", type: "specification" }` and nothing else. Compare legacy: `ingest-maths-spec/index.ts:58-62` and `ingest-chemistry-spec/index.ts:74-79` set `topic` **and** `spec_id` (and `section`). Past-paper ingesters set `year` (`ingest-chemistry-papers/index.ts:130`, `ingest-physics-papers/index.ts:175`).
- Three concrete effects:
  1. **Bare context headers.** `buildCappedContext` (`rag-chat/index.ts:663-666`) renders `[SPECIFICATION - <topic>]` when `topic` exists, else `[SPECIFICATION]`. Build-portal subjects always get the bare form, so the model cannot see which topic a spec point belongs to.
  2. **Inconsistent ranking.** `scoreChunkByKeywords` folds `JSON.stringify(metadata)` into the scored text (`:416`). Legacy chunks with `topic`/`spec_id` earn extra keyword hits; Build-portal chunks with empty metadata earn none — so within a mixed-provenance product the two ingest paths are not ranked on equal footing.
  3. **No recency bonus.** `getRecencyBonus` (`:96-105`) reads `metadata.year`; Build-portal content never has it, so it can never benefit from (or be correctly ordered by) recency.
- Fix: have the Build portal / `deploy-subject` attach `topic` (and `spec_id`/`section` where known) to every spec chunk, matching the legacy metadata contract. Document a single canonical metadata schema (`content_type`, `topic`, `spec_id`, `section`, `year`, `paper`, `question_number`, `marks`, `source`) and make every ingester conform.

### H2. `ingest-documents` and `ingest-school-material` write no `content_type`.
**Severity: Medium**

- Evidence: `ingest-documents/index.ts:104` metadata = `{ source }` only; `ingest-school-material/index.ts:180-186` writes `content`, `embedding`, and a `material_id`/school scope but no `content_type`.
- Scenario: `detectContentTypePriorities` (`rag-chat/index.ts:317-355`) and the type-balanced selection in `retrieveWithKeywords` (`:556-642`) bucket these as `'general'`. They are never in a prioritized type, so they are only ever picked up in leftover slots — content ingested via the generic document path is effectively second-class in retrieval.
- Fix: require `content_type` on every insert path (default to something meaningful, e.g. `notes`), and validate it server-side.

---

## MEDIUM — CHUNKING

### M1. Two incompatible chunking strategies; the fixed-window one splits atomic exam content.
**Severity: Medium**

- Evidence:
  - Atomic: `deploy-subject/index.ts:222-240` — one spec point → one chunk (good granularity), but **no overlap** and the topic/section context is not embedded in the chunk body.
  - Fixed-window: `ingest-documents/index.ts:10-31` and the identical copy in `ingest-school-material/index.ts:28-48` — 1000-char windows, 200 overlap, drop <50 chars, break on nearest space past the halfway point.
- Scenario: A mark-scheme level descriptor ("Level 4 (10–12 marks): ...") or a multi-clause spec point can be split across two 1000-char windows. Retrieval selects whole chunks, so the model may receive the first half of a level descriptor without the mark band, or a spec point shorn of its command word — degrading marking accuracy specifically.
- Fix: chunk on semantic boundaries for exam content — one spec point, one whole mark-scheme level, one whole question+its mark scheme per chunk (the `process-training-file` merge at `:360-417` already does QP+MS pairing — generalise that). Prepend the topic/section as a header line inside the chunk body so it travels with the text into both the embedding and the prompt. Keep overlap only for prose notes.

### M2. Structured spec points can be stored as raw JSON.
**Severity: Low-Medium**

- Evidence: `deploy-subject/index.ts:36-62` `sanitizeSpecPoint` falls back to `JSON.stringify(value)` when it can't extract a string field. That JSON becomes the chunk `content`.
- Scenario: A spec point that arrives as `{code, children:[...]}` without a `content`/`text` field is embedded and displayed as `{"code":"3.1.2",...}` — polluting the embedding, the keyword score, and the context shown to the model.
- Fix: fail loudly (log + skip) rather than stringifying, or flatten structured points into readable prose before embedding.

---

## MEDIUM — PROMPT / CONTEXT / RANKING

### M3. No reranking, length-biased scoring, greedy char cap.
**Severity: Medium**

- Evidence: `buildCappedContext` (`rag-chat/index.ts:653-691`) fills up to `MAX_CONTEXT_CHARS = 25000` (`:10`) greedily in score order. `scoreChunkByKeywords` is **unnormalised raw frequency**, so long chunks accumulate more hits and crowd out short, high-value spec points. Dedup is by chunk *index* only (`:495-531`) — identical or near-identical content from duplicate ingests is not collapsed (contrast `generate-revision-guide/index.ts:159` which dedups by first 100 chars).
- Fix: normalise score by chunk length (or use vector cosine per C1), add a lightweight rerank of the top-N candidates, and dedup by content hash before capping. Consider budgeting slots by content_type value (spec + mark scheme guaranteed a floor) rather than pure score.

### M4. Large, uncached prompt rebuilt every turn.
**Severity: Medium (cost/latency)**

- Evidence: `finalSystemPrompt` = pacing directive + optional school directive + brain/feedback/seasonal + `system_prompt_deluxe` + a ~1.5KB essay-marking block (`:1418-1432`) + up to 25KB training context + diagram block, sent with `history.slice(-10)` on every message (`:1476-1486`). No prompt caching. Estimated input cost logged at `:1558-1560`.
- Fix: enable prompt caching on the stable prefix (marking block, system prompt) if the gateway supports it; only inject the essay-marking block when `tool_type === 'essay_marker'`; trim history by token budget rather than a fixed last-10.

---

## MEDIUM — MODEL CHOICE

### M5. Essay marking in chat runs on Gemini 2.5 Flash; mock-exam marking uses Pro; no Claude in production; no automated quality metric.
**Severity: Medium-High for marking accuracy**

- Evidence: `rag-chat/index.ts:13-14` `fast: "google/gemini-2.5-flash"` handles **all** chat including essay marking (`:1471-1486`, `temperature:0` for marking). But `mock-exam-mark/index.ts:15` uses `google/gemini-2.5-pro`. `scripts/model-comparison.mjs` benchmarks Flash/Pro/Haiku/Sonnet on real marking tasks but **only measures TTFT, latency, tokens, cost, word count** — quality is left to manual review ("Review the JSON file to compare response quality side by side", tail of script). So there is no automated marking-accuracy signal, and the two marking surfaces disagree on model.
- Why it matters: marking is the correctness-critical task (mark ceilings, AO splits, level descriptors). Flash is the cheapest tier; the inconsistency (Pro for mock exams, Flash for chat marking) suggests the choice is cost-driven, not quality-validated.
- Fix: route marking (chat essay_marker + mock-exam) to a single stronger model — Gemini 2.5 Pro or Claude Sonnet — and build a rubric-scored eval (known question + official mark → does the model land within ±1 mark and cite the right AO/level) rather than a latency benchmark. Keep Flash for conversational/explanatory turns. This is the classic model-routing win: cheap model for chat, strong model for grading.

### M6. Safeguarding + attempt-gate + query planning all run on the cheapest utility model.
**Severity: Medium (compliance-adjacent)**

- Evidence: `MODELS.utility = "google/gemini-2.0-flash-lite"` (`:15`) drives `generateSearchQueries` (`:372`), `classifyStudentTurn` (`:777`), and `screenForSafeguarding` (`:845`).
- Note: query planning on a cheap model is fine. But the KCSIE safeguarding screen (`:831-864`) is recall-critical and runs on the cheapest model available. It is recall-biased and fails-closed-to-none on error (`:860-863`), which is the right posture, but the model tier for a child-safety path warrants explicit sign-off / validation.
- Fix: validate the safeguarding screen's recall on a labelled set; consider a stronger model or a second-pass check for this path specifically.

---

## MEDIUM — FRESHNESS / DUPLICATION

### M7. Past-paper re-ingest duplicates chunks; only some paths are idempotent.
**Severity: Medium**

- Evidence:
  - Idempotent (delete-then-insert): `deploy-subject/index.ts:210-215` (spec), `:263-267` (system_prompt), `:281-285` (exam_technique), `:301-306` (custom_section); `ingest-school-material/index.ts:162-166` (by `material_id`); `process-training-file` merges by question number.
  - **Not idempotent:** `ingest-content`, `ingest-chemistry-papers`, `ingest-physics-papers` insert without any prior delete (`ingest-chemistry-papers/index.ts:169-192`, `ingest-physics-papers/index.ts:215-238`). Re-running a paper ingest duplicates every question chunk.
- Scenario: Re-seeding 2024 Chemistry papers doubles those chunks. Because retrieval scores by raw keyword frequency and the past-paper path balances "slots per paper" (`rag-chat/index.ts:577-611`), duplicated papers get double weight and can crowd out other years.
- Fix: make every ingester delete prior chunks for the same `(product_id, paper_code/source)` before insert, or upsert on a natural key. Add a dedup sweep.

---

## LOW

### L1. ivfflat index is unused overhead and, if/when enabled, is sub-optimally configured.
**Severity: Low (until vector search is turned on)**

- Evidence: `migrations/20260115114606_*.sql:15-16` `USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)`. Unused today (C1). ivfflat quality depends on being built after data exists and on probe tuning; `lists=100` is large for small corpora.
- Fix: when you enable vector search (C1), prefer an HNSW index (`vector_cosine_ops`) for better recall without probe tuning, and (for ivfflat) rebuild after data load. Ensure the embedding model dimension (1536) stays matched to `vector(1536)`.

### L2. `search_only` past-paper finder is a separate, third retrieval implementation.
**Severity: Low**

- Evidence: `rag-chat/index.ts:952-1038` implements its own stop-word list, content-type include/exclude, and metadata-weighted scoring (`.limit(5000)`), distinct from both `retrieveWithKeywords` and `generate-revision-guide`. Three parallel retrieval code paths mean fixes (e.g. vector search) must be made in three places.
- Fix: consolidate onto one retrieval function once C1 lands.

---

## Per-query cost/latency profile (today)

For one chat message the function issues, roughly in sequence/parallel:
1. `generateSearchQueries` — 1 flash-lite call (`:1339`).
2. If school student: `classifyStudentTurn` + `screenForSafeguarding` — 2 more flash-lite calls (`:1227,:1325`).
3. Diagram match — 1 attempted `fast` call that currently always fails (C3) then keyword fallback (`:1402`).
4. Full-table chunk fetch into Deno memory (capped at 1000 rows, C2) + in-memory scoring.
5. 1 streaming Gemini 2.5 Flash completion (`:1495`).

The dominant scaling cost is step 4 (grows with product size, no index used) and the absence of prompt caching on a large static prefix (M4). Moving to `match_documents` (C1) collapses step 4 to an indexed top-K query and removes the 1000-row cliff.

---

## Recommended priority order

1. **C3** (one-line fix: `MODELS.main` → `MODELS.fast`) — immediate, restores diagram quality.
2. **C2** — add pagination or move ranking to SQL; stops silent content loss.
3. **C1** — switch retrieval to hybrid vector + keyword using the infra you already pay for; the biggest quality lever.
4. **H1/H2** — enforce one metadata schema across all ingest paths.
5. **M5** — route marking to a stronger model + build a rubric eval (not just latency).
6. **M1/M7** — semantic chunking for exam content + idempotent past-paper ingest.
7. Everything else as cleanup once retrieval is consolidated (L2).
