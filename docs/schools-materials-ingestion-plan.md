# A*AI Schools — Materials Ingestion (#10) — Full Build Plan

**Owner-continuity doc.** Written 2026-07-07 so that if the Fable-model budget expires
mid-build, a fresh **Opus** session can finish this without re-deriving anything. Read
`docs/SCHOOLS_B2B_HANDOVER.md` first, then this. Branch: **`feat/schools-b2b-layer`**.

---

> ## ⛔ STATUS: DEFERRED — DO NOT SHIP YET (decision 2026-07-07, James)
>
> **The MVP does not need this pipeline.** In school mode, `rag-chat` already retrieves the
> **entire existing Edexcel Economics B2C corpus** for free, because seated students query the
> same `product_id = edexcel-economics` and `fetchRelevantContext` pulls all of it. So a school
> gets the full spec/past-papers/mark-schemes Coach the moment its students are seated — **zero
> ingestion required.**
>
> This pipeline is **only** for a school's *own bespoke uploads* (their department mark scheme,
> mock, house style) — the B2B differentiator, not a copy of the shared corpus. James's call:
> **base reuse is enough for now; keep this plan complete for future use.** Build it when a
> pilot school actually asks to upload its own materials.
>
> **What exists as scaffolding on this branch (built, NOT wired, NOT deployed):**
> - `supabase/functions/ingest-school-material/index.ts` — the ingest fn (Fable-written, Opus-reviewed).
> - `<scratchpad>/materials_test.py` — the post-deploy verifier (Fable-written, Opus-reviewed).
>
> **What is deliberately NOT done (do these when un-deferring):**
> - ❌ `config.toml` entry for `ingest-school-material` (fn not registered → won't deploy).
> - ❌ Frontend trigger in `MaterialsPanel.tsx` (§4) — panel still uploads into a no-op today.
> - ❌ rag-chat retrieval merge (§5) — the compliance-critical Opus piece.
> - ❌ delete-cleanup migration (§6) — not needed until chunks exist.
> - ⚠️ **Materials tab is a black hole today:** it lets teachers upload files that will sit at
>   `pending` forever (nothing processes them). Before any school sees it, either gate it to a
>   "coming soon" state or complete §4+§5. See handover.
>
> Everything below is the complete build spec for when this is un-deferred. It is accurate and
> ready to execute — just do §4, §5, §6, add the config.toml entry, deploy, and run the verifiers.

---

## 0. Confirmed state at time of writing (verified, not assumed)

- **`rag-chat` school layer is NOT deployed.** `gate_test.py` run against prod 2026-07-07:
  T1 door did **not** fire, `coach_interactions` empty → deployed `rag-chat` (v209) is the
  pre-school-layer version. **Blocker #1 (James deploys rag-chat) still stands.**
- **Vertex/GCP creds** for slice 3 have **not** arrived → slice 3 stays blocked.
- **Storage buckets** (prod, verified via Storage API): `school-materials` (private ✅),
  `school-branding` (public), `trainer-uploads` (public). Bucket already exists — no bucket
  creation needed.
- **`document_chunks`** columns (from generated types): `content` (NOT NULL), `embedding`
  (nullable), `metadata` (jsonb nullable), `product_id` (nullable, FK→products). **Both
  `product_id` and `embedding` are nullable** — the scoping design below depends on this.
- **Retrieval is NOT vector search.** `fetchRelevantContext` (rag-chat) fetches *all* chunks
  `.eq('product_id', productId)` and ranks in memory by keyword / AI-generated query. It only
  selects `content, metadata` — embeddings are unused at read time. ⇒ embeddings on school
  chunks are best-effort future-proofing, not required for retrieval to work.
- **`school-*` edge fns already in prod** (`school-invite`, `school-accept-invite`,
  `school-checkout`) are the pre-existing invite/seat flow, present in the repo. Not part of
  this task; don't touch.
- No PDF/DOCX extraction library is used anywhere in `supabase/functions/` yet — this task
  introduces one.

---

## 1. What we're building

A school uploads its own mark scheme / mock paper / house style in the Teacher Dashboard →
Materials tab → the Coach retrieves and uses it **only for that school's students**, never on
the B2C path and never for another school.

Frontend already exists and is committed (`src/components/schools/panels/MaterialsPanel.tsx`):
it uploads the file to the `school-materials` bucket at path `{school.id}/{ts}-{safeName}` and
inserts a `school_materials` row with `processing_status:'pending'`. **It triggers no
processing today** — "processing happens automatically" is currently untrue. This task makes
it true and makes the Coach actually use the material.

`school_materials` columns (migration `20260707120000_b2b_schools_layer.sql`):
`id, school_id, product_id?, uploaded_by?, title, material_type?, file_url?,
processing_status ('pending'|'processing'|'done'|'failed'), chunks_created, created_at`.
Status vocabulary the UI styles: `pending / processing / done / failed`.

---

## 2. The scoping decision (COMPLIANCE-CRITICAL — do not change without thinking it through)

School-material chunks go in `document_chunks` with:
- **`product_id = NULL`**  ← the structural safety property
- `embedding` = best-effort (may be null if embed call fails)
- `metadata = { content_type: 'school_material', school_id, material_id, material_type, title }`

**Why `product_id = NULL`:** the B2C retrieval path filters `.eq('product_id', productId)`.
A row with `product_id = NULL` can *never* be returned by that query. So school material
**cannot** leak onto the B2C path or to another product — it's a structural guarantee, not a
filter someone has to remember to keep. School retrieval is a *separate, explicit,
school_id-scoped* fetch (§5). This is a Children's-Code / data-segregation requirement, not a
nicety. **If you ever set `product_id` on a school chunk, you have created a cross-school
leak.**

---

## 3. New edge function: `supabase/functions/ingest-school-material/index.ts`

**Contract:** `POST { material_id }` (invoked by the frontend fire-and-forget after upload,
and re-runnable manually). Service-role only (reads storage + writes chunks). Add
`verify_jwt = false`? **No** — it's called from the client with the user's JWT; keep default
JWT verification. It uses the service-role key from env for its DB/storage work regardless.

**Steps:**
1. Parse `material_id`. Load the `school_materials` row (service role). If missing → 404.
2. Set `processing_status = 'processing'`.
3. Download `file_url` from the `school-materials` bucket via
   `supabase.storage.from('school-materials').download(file_url)`.
4. **Extract text by extension** (lowercase the `file_url` suffix):
   - `.txt`, `.md` → `await blob.text()`.
   - `.pdf` → `unpdf` (`https://esm.sh/unpdf`): `extractText(await blob.arrayBuffer())`,
     join pages with `\n\n`. Text-layer PDFs only; scanned/image PDFs yield ~empty text →
     treat empty extraction as a soft failure (status `failed`, reason "no extractable text —
     is this a scanned PDF?").
   - `.docx` → `mammoth` (`https://esm.sh/mammoth`): `extractRawText({ arrayBuffer })`.
     If mammoth proves heavy/flaky under Deno, fall back to marking `.docx` failed with a
     clear reason and ship pdf+txt+md; **do not block the batch on docx**.
   - anything else → `failed`, reason "unsupported file type".
5. If extracted text is empty/whitespace → `failed` (see reason above), return.
6. **Idempotent re-ingest:** delete prior chunks for this material first:
   `delete from document_chunks where metadata->>'material_id' = material_id`.
7. Chunk with the existing chunker (copy from `ingest-documents`: `chunkText(text, 1000, 200)`,
   drops <50-char chunks).
8. For each chunk: embed best-effort via Lovable gateway
   (`https://ai.gateway.lovable.dev/v1/embeddings`, model `text-embedding-3-small`,
   `Bearer ${LOVABLE_API_KEY}`). On embed error, log and insert with `embedding: null` — never
   abort the whole material for one embed failure.
9. Insert each chunk: `{ product_id: null, content, embedding, metadata: {content_type:
   'school_material', school_id, material_id, material_type, title} }`.
10. Update row: `processing_status='done'`, `chunks_created = N`. On any thrown error anywhere
    → catch, set `processing_status='failed'`, return 200 with `{ok:false, reason}` (the
    frontend fire-and-forget ignores the body; status is read from the row on reload).

**Reuse verbatim from `ingest-documents/index.ts`:** `corsHeaders`, `chunkText`,
`generateEmbedding`. Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `LOVABLE_API_KEY`
(all already present for other fns).

**config.toml:** add a `[functions.ingest-school-material]` block. Default `verify_jwt`
(true) is fine. Check how sibling ingest fns are declared and match.

---

## 4. Frontend trigger — `MaterialsPanel.tsx` (small edit)

In `handleUpload`, after the successful `school_materials` insert (currently line ~162), fetch
the inserted row id (change the insert to `.select('id').single()`), then fire-and-forget:

```ts
supabase.functions.invoke('ingest-school-material', { body: { material_id: inserted.id } });
```

Do **not** await it blocking the UI — show the toast + reload immediately; the row shows
`pending`→`processing`→`done` on subsequent loads. (Optional nicety, defer: poll/realtime to
auto-refresh status. MVP: user re-opens tab or we reload once after a short delay.)

Keep the accept list as-is (`.pdf,.txt,.md,.docx`) per James: "use all files."

---

## 5. rag-chat retrieval — school-material merge (COMPLIANCE-CRITICAL integration)

Call site: `fetchRelevantContext(...)` at **rag-chat/index.ts line ~1378**. School context is
already resolved above it: `schoolMode` (bool) and `schoolMember.school_id` are in scope from
~line 1196.

**Design:** only when `schoolMode === true`, after the normal product retrieval, run a second
fetch and merge:

```ts
// pseudo — implement inside/next to fetchRelevantContext, gated on schoolMode
const { data: schoolChunks } = await supabase
  .from('document_chunks')
  .select('content, metadata')
  .is('product_id', null)
  .eq('metadata->>school_id', schoolId);   // PostgREST jsonb text filter
```

- Rank these in memory with the *same* keyword/AI-query logic used for product chunks.
- **Cap** the school-material contribution (e.g. top 3–4 chunks / ~1500 chars) so it augments
  rather than swamps the spec/mark-scheme context.
- Tag the merged block clearly in the context string, e.g.
  `=== YOUR SCHOOL'S MATERIALS (authoritative for this class) ===` so the model knows to
  prefer the school's own mark scheme/house style when relevant.
- **Never** run this fetch when `schoolMode` is false → zero effect on B2C and on
  teachers/admins previewing (they're not schoolMode students).

**Guardrail check:** confirm the `.eq('metadata->>school_id', schoolId)` filter actually binds
in this supabase-js version; if the `->>'` operator filter misbehaves, fall back to fetching
`.is('product_id', null)` + in-memory `.filter(c => c.metadata?.school_id === schoolId)`.
The in-memory filter is the safe default given the (currently small) volume of school chunks.

---

## 6. Delete cleanup — new migration (APPROVED by James 2026-07-07)

The delete dialog promises "the Coach will stop using it," but the client can't delete
`document_chunks` (no service role) → orphaned chunks keep being retrieved. Fix with an
**additive** migration (never edit an existing migration file):

`supabase/migrations/<NEW_TS>_school_material_chunk_cleanup.sql`:

```sql
create or replace function public.delete_school_material_chunks()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  delete from public.document_chunks
   where metadata->>'material_id' = old.id::text;
  return old;
end $$;

drop trigger if exists trg_delete_school_material_chunks on public.school_materials;
create trigger trg_delete_school_material_chunks
  after delete on public.school_materials
  for each row execute function public.delete_school_material_chunks();
```

Apply via the Management API path (`apply_migration.py` in the scratchpad — needs the
`User-Agent` header + `sbp_` token). Verify with `verify_migration.py` pattern.

---

## 7. Deploy & verify (James does the deploy; Opus writes the verifier)

All of this is undeployable/untestable locally (no Deno/CLI). Build the whole batch, then:

1. **James deploys** `rag-chat` **and** `ingest-school-material` via Lovable/CLI (edge fns do
   NOT deploy on git-push; only the frontend does, via Vercel).
2. **James applies** the delete-cleanup migration (§6).
3. **Opus runs `gate_test.py`** → must be ALL PASS (confirms the school behaviour layer is
   finally live).
4. **Opus runs a new `materials_test.py`** (to be written, mirrors gate_test's seed/teardown):
   - seed a school + seated student + a class, upload a tiny `.md` material via storage +
     row insert, invoke `ingest-school-material`, assert `processing_status='done'` &
     `chunks_created>0` & chunks exist with `product_id IS NULL` and the right `school_id`;
   - call `rag-chat` as the seated student with a question that only the uploaded material
     answers, assert the material's content influences the reply;
   - assert a B2C (non-school) call to `rag-chat` for the same product does **not** surface the
     school chunk (leak check);
   - delete the material row, assert chunks are gone (trigger works);
   - tear everything down in a `finally`.

---

## 8. Work breakdown & delegation (Fable expiring — use it today)

| # | Task | Model | Why |
|---|------|-------|-----|
| A | This plan doc | Opus | reasoning/durability core ✅ done |
| B | `ingest-school-material/index.ts` (mirror ingest-documents + pdf/docx/txt/md extraction) | **Fable** subagent | self-contained, spec is precise; Opus reviews |
| C | `config.toml` entry | Opus (trivial, inline) | one block |
| D | `MaterialsPanel.tsx` invoke edit | **Fable** subagent | small, mechanical |
| E | rag-chat retrieval merge (§5) | **Opus** | compliance-critical, core file |
| F | delete-cleanup migration (§6) | **Opus** | sacred dir, must be exact |
| G | `materials_test.py` verifier | **Fable** subagent (Opus reviews) | mirrors existing gate_test |
| H | `npm run build` + fix | Opus | tsc/eslint gate (custom ui/tabs caveat) |

**Every Fable output is reviewed by Opus before commit.** If Fable is unavailable, Opus does
B/D/G directly — they're fully specified above.

Commit atomically, one concern each: (B+C) ingest fn, (D) trigger, (E) rag-chat retrieval,
(F) migration, then handover-doc update. Run `npm run build` after D & E (custom
`src/components/ui/tabs.tsx` means tsc misses some export errors — build catches them).

---

## 9. Post-completion

- Update `docs/SCHOOLS_B2B_HANDOVER.md`: mark #10 done-but-undeployed; note the two verifiers
  to run post-deploy; keep blockers #1/#2.
- Do **not** claim UK-only processing (Vertex cutover not live).
- Leave `#8 skill_events` and `#7 slice-6 nuance` as the next open tasks.
</content>
</invoke>
