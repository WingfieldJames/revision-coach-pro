# A*AI Schools (B2B) — Session Handover

**Purpose:** resume the Schools B2B build exactly where it stands. Read this first, then `git log --oneline` and the task list.

> **📋 The full end-to-end plan for the whole B2B build lives in
> [`docs/schools-b2b-master-plan.md`](./schools-b2b-master-plan.md)** — vision, 12-table data
> model, all 6 slices with status, the behaviour-layer spec, residency plan, dashboard panels,
> and the prioritised "what's left to finish" list. This handover is the *session state*; that
> is the *master plan*.

Last updated: **2026-07-08**. Branch: **merged to `main` and pushed** (auto-deploys frontend via Vercel). The `feat/schools-b2b-layer` branch has been fast-forwarded onto `main`; work continues on `main`.

**Also see:** the **positioning artifact** — capability & marketing inventory, honestly tiered Live/Built/Roadmap (what to market, how to frame it). Published at `https://claude.ai/code/artifact/8dc396f8-20d0-48fa-9a61-cec3ee85e5f6`; HTML source in the current session scratchpad (`schools-positioning.html`). **Not yet committed to `docs/`** — offer to if it should be durable.

---

## 1. TL;DR — current state

Building an institutional (B2B) layer on the existing B2C Edexcel Economics Coach so schools get traceable, teacher-monitorable AI that withholds answers by default (DfE / KCSIE moat). It mounts **inside the existing Schools page**, additive, B2C untouched.

**Done + committed (all builds clean, `npm run build` green):**
- **Schema** — 12 tables + RLS **applied & verified in prod** (`eu-west-2`/London). Migration `supabase/migrations/20260707120000_b2b_schools_layer.sql`.
- **Access pair** — `productAccess.ts` (client) + `rag-chat` (server) both grant deluxe via active school seat. Verified with a seeded fixture.
- **Behaviour layer** (`rag-chat`) — server-resolved `schoolMode` (students only), attempt-first **door** gate (lenient classifier, fails open), per-class directive, seat→deluxe, per-class daily cap, server-only `coach_interactions` logging (previews role-tagged out of analytics).
- **Safeguarding** (`rag-chat`) — recall-biased screen → `safeguarding_flags` (DSL-only) + best-effort Resend alert.
- **Frontend** — `/schools/app/*` mount, `useSchoolMembership`, `StudentCoach` shell (branded header, AI-disclosure banner, usage meter, full tool surround), `TeacherDashboard` + 6 tabs: Overview / Roster / Safeguarding / Settings(Tunability) / Materials / Branding.
- **Routing (2026-07-08)** — schools **marketing page moved `/progress` → `/schools`** (308 redirect in `vercel.json` + client fallback; canonical/sitemap/all internal links updated). **Login seam wired:** "Log into your school account" → `/login?redirect=schools/app` so seated users land in the app. `/schools/app/*` is the gated product. *(Cosmetic debt: the component file is still `ProgressPage.tsx`.)*
- **Per-class feature control + writing-aid lock (2026-07-08)** — teachers tailor each class: `class_ai_settings.enabled_features text[]` (migration `20260708120000_class_enabled_features.sql`, **applied to prod**; null = show all). `StudentCoach` gates every tool by `hasFeature(id) && classEnabled(id)`; **essay marker now honours `writing_aid_unlocked`** (default locked — closes the earlier "essay marker always shown" gap). Tunability panel has a "Tools students can see" card. Verified end-to-end via REST+RLS round-trip.

**Verified vs not:**
- ✅ Schema, RLS, access pair, per-class feature control — DB-verified via Management API + REST.
- ✅ Frontend — `tsc` + `eslint` + `npm run build` clean; **merged to `main`, live on Vercel** (only demo school seated → nil real exposure).
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
- `materials_test.py` — post-deploy verifier for the (deferred) materials pipeline: seeds a class, uploads a sentinel `.md`, ingests, asserts chunks are `product_id=null`/school-scoped, leak-checks, tests delete cleanup. Only meaningful once `ingest-school-material` is deployed + un-deferred.
- `seed_demo_school.py` — (re)seeds the demo school below.

Note: the `.sb-secrets.env` + these scripts live in the **prior session's** scratchpad (`…/8358bb4a-…/scratchpad/`), confirmed present 2026-07-08. If gone, ask James to re-provide the secrets.

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
  the pipeline first. **(Frontend is now live on `main`/Vercel — but only the demo school is
  seated, so this is a pre-real-onboarding hygiene item, not a live incident.)**
- **#8 skill_events population** — nothing writes `skill_events` yet → dashboard skill bars empty. Needs a real design (derive per-skill 0–1 signal from essay-marker AO marks / coaching), written server-side from `rag-chat`.
- **#7 Slice 6 surround** — tool suite wired; **per-class tool visibility + writing-aid lock now DONE (2026-07-08)**. Remaining nuance: ensure tools respect usage-cap/logging server-side (edge work, needs deploy).
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

1. Memories auto-load (see `MEMORY.md`). Read this file, then `docs/schools-b2b-master-plan.md`.
2. `cd` to repo — **work is on `main`** now (branch merged). `git log --oneline -15`.
3. Confirm the scratchpad secrets file still exists (§3) or ask James to re-provide.
4. If James has deployed `rag-chat`: run `gate_test.py`, then proceed to **#8 skill_events** (next real build). If Vertex creds arrived: do slice 3. Otherwise: buildable-blind work is limited (see master plan §7) — confirm scope with James before building edge code that can't be verified until deploy.
