# A*AI Schools (B2B) — Session Handover

**Purpose:** resume the Schools B2B build exactly where it stands. Read this first, then `git log --oneline` and the task list.

> **📋 The full end-to-end plan for the whole B2B build lives in
> [`docs/schools-b2b-master-plan.md`](./schools-b2b-master-plan.md)** — vision, 12-table data
> model, all 6 slices with status, the behaviour-layer spec, residency plan, dashboard panels,
> and the prioritised "what's left to finish" list. This handover is the *session state*; that
> is the *master plan*.

Last updated: 2026-07-07, end of build session. Branch: **`feat/schools-b2b-layer`** (10 commits, **not pushed**).

---

## 1. TL;DR — current state

Building an institutional (B2B) layer on the existing B2C Edexcel Economics Coach so schools get traceable, teacher-monitorable AI that withholds answers by default (DfE / KCSIE moat). It mounts **inside the existing Schools page**, additive, B2C untouched.

**Done + committed (all builds clean, `npm run build` green):**
- **Schema** — 12 tables + RLS **applied & verified in prod** (`eu-west-2`/London). Migration `supabase/migrations/20260707120000_b2b_schools_layer.sql`.
- **Access pair** — `productAccess.ts` (client) + `rag-chat` (server) both grant deluxe via active school seat. Verified with a seeded fixture.
- **Behaviour layer** (`rag-chat`) — server-resolved `schoolMode` (students only), attempt-first **door** gate (lenient classifier, fails open), per-class directive, seat→deluxe, per-class daily cap, server-only `coach_interactions` logging (previews role-tagged out of analytics).
- **Safeguarding** (`rag-chat`) — recall-biased screen → `safeguarding_flags` (DSL-only) + best-effort Resend alert.
- **Frontend** — `/schools/app/*` mount, `useSchoolMembership`, `StudentCoach` shell (branded header, AI-disclosure banner, usage meter, full tool surround), `TeacherDashboard` + 6 tabs: Overview / Roster / Safeguarding / Settings(Tunability) / Materials / Branding.

**Verified vs not:**
- ✅ Schema, RLS, access pair — DB-verified via Management API + REST.
- ✅ Frontend — `tsc` + `eslint` + `npm run build` clean; renders against seeded demo data (dev server).
- ❌ `rag-chat` behaviour (gate/safeguarding) — **written, committed, NOT deployed** → not runtime-verified. Deploy is the unblocker. **Re-confirmed 2026-07-07 via `gate_test.py` against prod: door did NOT fire, `coach_interactions` empty → deployed `rag-chat` (v209) is still the pre-school-layer version.** (Test self-cleans; no prod residue.)

---

## 2. The two blockers (both need James)

1. **Deploy `rag-chat`.** Edge functions deploy via **Lovable/CLI**, NOT Vercel/git-push (frontend deploys on push→Vercel). After deploy, run the gate test (see §4).
2. **Vertex/GCP creds** for slice 3 (residency cutover off Lovable): a GCP project with Vertex AI enabled in `europe-west2`, a service-account JSON (`Vertex AI User`), and confirm model `gemini-2.5-flash`.

---

## 3. Persistent assets (survive on disk across sessions)

Scratchpad dir (this session): `/private/tmp/claude-501/-Users-jameswingfield-dev-revision-coach-pro/8358bb4a-6ef3-4ba3-b5ab-3c61b3fdca04/scratchpad/`
- `.sb-secrets.env` — Supabase **service-role key** + **Management API token** (`sbp_…`). A new session can read this absolute path if it still exists; otherwise ask James to re-provide (paste into a new scratchpad `.sb-secrets.env`).
- `apply_migration.py` — applies a migration via Management API (`POST /v1/projects/{ref}/database/query`). Note the **User-Agent header** is required (Cloudflare 1010 otherwise).
- `verify_access_pair.py` — seeds a fixture, checks client+server access grant as a pair, tears down.
- `gate_test.py` — **run AFTER rag-chat deploy**: seeds a seated student, asserts no-attempt→door / attempt→coaching, checks audit rows.
- `seed_demo_school.py` — (re)seeds the demo school below.

Project ref: `xoipyycgycmpflfnrlty`. Management API needs `User-Agent` header + `sbp_` token. Service-role key works for REST/seed/verify (not DDL).

---

## 4. Demo school (real data in prod, clearly named)

**Meridian Sixth Form (DEMO)** — seeded for a compelling dashboard. Offloading trend 0.70→0.19 over 6 weeks; "Jess Miller" = analyse-but-can't-evaluate outlier + the safeguarding flag.
- HoD/admin login: `demo-hod@astarai-demo.invalid` / `DemoHoD2026!`
- Students: `demo-student1..6@astarai-demo.invalid` / `DemoStudent2026!`
- View: dev server → `/login` → `/schools/app` (role-branches to dashboard).
- **Cleanup:** re-run `seed_demo_school.py` (it wipes+reseeds) or delete the school row (cascades). Remove before go-live.

Post-deploy gate test:
```
python3 <scratchpad>/gate_test.py   # expects ALL PASS once rag-chat is deployed
```

---

## 5. Next work (open tasks)

- **#10 Materials ingestion (backend) — DEFERRED 2026-07-07 (James): base reuse is the MVP.**
  Key realisation: in school mode `rag-chat` already retrieves the **full existing Edexcel Econ
  B2C corpus** for free (students query the same `product_id`), so a school gets the whole Coach
  the moment its students are seated — no ingestion needed. This pipeline is *only* for a
  school's **own bespoke uploads** (their mark scheme / mock / house style), the B2B moat.
  **Full build spec + status:** `docs/schools-materials-ingestion-plan.md` (STATUS: DEFERRED).
  **Scaffolding built this session (present, NOT wired, NOT deployed):**
  `supabase/functions/ingest-school-material/index.ts` (Opus-written after Fable died mid-call;
  pdf via unpdf / docx via mammoth / txt+md; chunks inserted with **`product_id = null`** =
  structural cross-school leak guard) + `<scratchpad>/materials_test.py` verifier (Fable-written,
  Opus-reviewed). **Not done (do when un-deferring):** config.toml entry, `MaterialsPanel`
  invoke trigger, rag-chat school-material retrieval merge, delete-cleanup migration, deploy.
  ⚠️ **Before any real school sees the dashboard:** the Materials tab currently accepts uploads
  that sit at `pending` forever (nothing processes them) — gate it to "coming soon" or complete
  the pipeline first. (Not live yet: branch unpushed, so no Vercel deploy.)
- **#8 skill_events population** — nothing writes `skill_events` yet → dashboard skill bars empty. Needs a real design (derive per-skill 0–1 signal from essay-marker AO marks / coaching), written server-side from `rag-chat`.
- **#7 Slice 6 surround** — largely already covered by `StudentCoach` wiring the tool suite; remaining nuance: ensure tools respect usage-cap/logging.
- **#4 Slice 3 Vertex cutover** — blocked on creds (§2). Also fold in here: the §3 rules 6–7 (anthropomorphism/sycophancy) **regeneration backstop** (staged — currently directive-only), and the **weekly cap** (RPC is daily-only).

Note: all remaining edge-function work is undeployable/untestable locally (no Deno/CLI here) → build it in a batch and have James deploy, then verify.

---

## 6. Guardrails & decisions (also in ~/.claude memories)

- **Don't claim "all pupil data processed in the UK"** until the Vertex `europe-west2` cutover is live (DB is London; inference isn't UK yet).
- **Attempt gate: lenient, false-reject = sev-1.** Safeguarding: **recall over precision**; DSL routing bypasses class teacher.
- **Sacred files** (explicit per-change sign-off): `productAccess.ts`, `stripe-webhook/**`, `create-checkout/**`, `migrations/**`, any RLS, `AuthContext.tsx`. (Exam-season freeze lifted 2026-07-07.)
- **Gotchas:** `src/components/ui/tabs.tsx` is **custom** (not shadcn — `<Tabs selected setSelected tabs>`); **always `npm run build`** after UI work (tsc misses missing-export errors). Repo `migrations/` had **drifted from prod** — verify prod state before assuming a migration applied.
- **Decide-and-flag:** null-`product_id` license grants access (single-product world); branding storage policy is permissive (tighten with school_id path); teachers/admins preview **ungated**, role-tagged out of analytics.

---

## 7. How to resume in a new session

1. Memories auto-load (see `MEMORY.md`). Read this file.
2. `cd` to repo, `git checkout feat/schools-b2b-layer`, `git log --oneline -12`.
3. Check task list. Confirm the scratchpad secrets file still exists (§3) or ask James to re-provide.
4. If James has deployed `rag-chat`: run `gate_test.py`, then proceed to #10/#8. If Vertex creds arrived: do slice 3. Otherwise: nothing new to build blind — confirm with James.
