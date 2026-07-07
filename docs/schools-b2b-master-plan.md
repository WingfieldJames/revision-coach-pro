# A*AI Schools (B2B) — Master Build Plan

**The single durable plan for the whole B2B build — from original design through to
"finished".** Consolidates the original pre-implementation plan (previously only in an
ephemeral scratchpad HTML), the session handover, and the materials sub-plan. Committed on
`main` so it survives scratchpad cleanup.

- **Companion docs:** `docs/SCHOOLS_B2B_HANDOVER.md` (session resume-point + secrets/scripts),
  `docs/schools-materials-ingestion-plan.md` (the deferred #10 sub-plan).
- Branch of record: work now merged to **`main`**. Last updated: **2026-07-07**.
- Subject: **Edexcel A-Level Economics A (9EC0)**. Everything is additive; **B2C untouched**.

---

## 0. Vision (why this exists)

An institutional layer on the existing B2C Edexcel Economics Coach: **traceable,
teacher-monitorable AI that withholds answers by default** (attempt-first). It is the DfE /
KCSIE "moat" — a Coach that builds exam skill instead of doing the work, with a teacher
dashboard that *proves* offloading falls as skill rises. Built **inside** the existing schools
surface, wrapping the existing Coach, no fork of B2C.

**Not greenfield.** A first-gen schools layer already existed (schools / school_licenses /
school_members + invite/checkout fns + a marketing page + a dashboard shell). This build
reuses that and adds only the genuine gaps (class grain, behaviour gates, audit, safeguarding,
dashboard, residency).

---

## 1. Architecture & seams (all additive)

| Seam | How | Status |
|---|---|---|
| **Mount** | one wildcard route `‹/schools/app/*› → SchoolsApp` with its own inner router; role-branches student→Coach, teacher/admin→Dashboard | ✅ done |
| **Role resolution** | `useSchoolMembership(user.id)` hook resolves `school_members.role` — **AuthContext untouched** (sacred) | ✅ done |
| **Access** | one branch in `productAccess.ts`: active `school_members` → live `school_licenses` covering the product → `{hasAccess:true, tier:'deluxe'}`. B2C path identical to before | ✅ done |
| **Behaviour** | server-resolved `schoolMode` in `rag-chat` (from auth token, never a client param) composes the directive + activates flow gates. B2C never enters this path | ✅ written, ⚠️ **NOT deployed** |
| **Marketing → app** | `/schools` landing → "Log into your school account" → `/login?redirect=schools/app` → seated users land in the app | ✅ done (this session) |

**Routing note (this session):** the schools **marketing** page moved `/progress → /schools`
(308 redirect in `vercel.json` + client fallback; canonical/sitemap/all internal links
updated). `/schools/app/*` is the gated **product**. `/schools/info-pack` is the info pack.

---

## 2. Data model — 12-table additive layer

One consolidated migration `supabase/migrations/20260707120000_b2b_schools_layer.sql`,
**applied & verified in prod** (`eu-west-2` / London). Keys on existing `auth.users.id`; no
columns on `users`.

| Table | Purpose | Status |
|---|---|---|
| `schools` (+`logo_url`,`primary_color`,`dsl_name`,`dsl_email`) | org + branding + safeguarding contact | ✅ |
| `classes` | school→class grain (`spec_focus`, teacher) | ✅ |
| `class_members` | class ↔ user | ✅ |
| `class_ai_settings` | per-class tuning: scaffolding, writing-aid lock, blocked topics, daily/weekly cap | ✅ schema; ⚠️ **weekly cap RPC not built** (daily only) |
| `coach_interactions` | **server-written** audit log (prompt/response/sources/offload_score/attempt_detected/disclosure_state) | ✅ (writes live once rag-chat deployed) |
| `skill_events` | per-interaction skill signal (KAA/EVAL/DIAGRAM/APPLICATION) | ⚠️ **table only — nothing writes it (#8)** |
| `safeguarding_flags` | DSL-scoped queue | ✅ |
| `assignments` / `assignment_submissions` | set a paper, review attempt + transcript | ✅ schema; UI not built |
| `school_materials` | uploaded mark schemes/mocks → chunks | ✅ schema + upload UI; ⛔ **ingestion deferred (#10)** |
| `school_members.role` | +`dsl` in CHECK | ✅ |

**RLS:** `SECURITY DEFINER` helpers (`is_school_member`, `has_school_role`, `class_school`)
avoid recursion; students see own rows, teachers their classes, admin/dsl the school,
`safeguarding_flags` DSL-only. ✅ applied & verified.

---

## 3. Slice status — the whole build at a glance

The original plan shipped as slices 0–6. Current reality:

| Slice | What | Status |
|---|---|---|
| **0** Pre-flight | region + migration-drift checks | ✅ done (region = London; repo migrations had drifted — verified against prod) |
| **1** Data model + RLS + productAccess bridge | migration, `productAccess.ts` | ✅ **done, applied, verified** |
| **2** Behaviour layer in rag-chat | attempt-gate + directive + logging | ✅ written/committed · ⚠️ **NOT deployed** (blocker #1) |
| **3** Compliance plumbing | audit log ✅ · safeguarding ✅ · **Vertex europe-west2** ❌ · post-filter backstop ⚠️ · weekly cap ⚠️ | 🟡 **partial** |
| **4** Dashboard MVP + student shell + mount | components + 1 line App.tsx | ✅ **done** (6 panels) |
| **5** Branding + materials upload | branding ✅ · materials UI ✅ · materials backend ⛔ deferred | 🟡 **partial** |
| **6** Surround suite integration | tools in StudentCoach | 🟡 mostly done; nuance: tools must respect cap/logging (#7) |

---

## 4. The behaviour layer (§3 of original plan) — the compliance-critical delta

Enforced as **server-side flow gates**, not prompt text a model can drift from. All in
`rag-chat`, gated on `schoolMode` (students only).

**Attempt-first gate (rules 1–4)** — a state machine tracked in `coach_interactions`:
Gate 1 attempt required → Step 2 genuine-attempt check (lenient utility-model classifier on
*reasoning shape*, **fails open** — wrong-but-real passes, only "just write it" fails; every
decision logged) → Step 3 progressive disclosure (hint → partial → more) → Step 4 reveal only
post-attempt, framed as comparison. **Cognitive-offloading** score per turn → escalating
nudge, never a lockout. → ✅ **written**; runtime-unverified until deploy (`gate_test.py`).

**Remaining rules & enforcement:**
| # | Rule | Mechanism | Status |
|---|---|---|---|
| 5 | Mode friction | writing-aid default-locked per class, server-checked | ✅ (directive/settings) |
| 6 | No anthropomorphism | directive **+ server-side output post-filter** strips persona I-statements | ⚠️ **directive only — post-filter backstop not built** |
| 7 | No sycophancy | directive **+ post-filter** flags flattery; technique-anchored feedback | ⚠️ **directive only — post-filter not built** |
| 8 | Usage limits | daily cap via `increment_prompt_usage` RPC | ✅ daily; ⚠️ **weekly cap not built** |
| 9 | AI disclosure | persistent non-dismissable banner (EU AI Act Art. 50) | ✅ (StudentCoach) |
| 10 | Grounded | retrieval anchored to `document_chunks` + past-paper recency; school materials alongside | ✅ (school-material retrieval part of deferred #10) |

**Why the post-filter matters:** rules 1–5,8 are pre-generation gates (model can't break them);
6–7 are generation-*style* which a prompt can drift on → they need a lightweight server-side
output filter to tell a DPO "enforced by construction." **This backstop is the main unbuilt
piece of the behaviour layer.**

---

## 5. Compliance & residency (§4) — the move off Lovable

Today: `rag-chat → ai.gateway.lovable.dev → Gemini 2.5 Flash` (US hop, no residency/no-training
guarantee). rag-chat is the single chokepoint, so the swap is contained.

- **Decision:** **Google Vertex AI, `europe-west2` (London)** — keeps Gemini (zero technique
  re-tune), pins UK residency, contractual no-training. Introduce as a provider branch gated on
  `schoolMode`. Touch-list beyond rag-chat: `analyze-image`, `find-diagram`, `mock-exam-mark`,
  embedding calls. → ❌ **BLOCKED on GCP creds (blocker #2).**
- **Data residency now:** DB is **London ✅**; **inference is not UK until Vertex lands.**
  ⚠️ **Do NOT claim "all pupil data processed in the UK" until the Vertex cutover is live.**
- Audit log server-enforced ✅. Safeguarding pathway ✅ (Resend alert, DSL-only). Data-subject
  export/delete routine — **not built** (needed for DPA completeness). Sub-processor list for the
  DPA: Supabase (London), Vertex (europe-west2, pending), Stripe, Resend, Vercel.

---

## 6. Teacher dashboard — panel status

Wraps the existing shell; overview-first (who needs attention), then drill-downs. 6 panels
built:

| Panel | Maps to | Status |
|---|---|---|
| Overview (offloading trend — the pilot proof) | offloading report | ✅ renders (from `coach_interactions`; live data after deploy) |
| Roster & usage | DfE usage-visibility | ✅ |
| Skills (KAA/Eval/Diagram/Application) | skill diagnostic | ⚠️ **bars empty — `skill_events` unpopulated (#8)** |
| Safeguarding (DSL queue) | safeguarding | ✅ |
| Settings / Tunability | AI tunability → `class_ai_settings` | ✅ |
| Materials | customisation | ✅ UI; ⛔ backend deferred (uploads sit `pending`) |
| Branding | customisation | ✅ |
| Assignments · Reporting/export | assignments, SLT report | ❌ **not built** (schema exists) |

---

## 7. What's left to FINISH B2B — prioritised

> **Legend:** 🔴 blocker · 🟠 build · 🟢 quick · ⛔ deferred

1. **🔴 Deploy `rag-chat` via Lovable/CLI** (git-push does NOT deploy edge fns). Unblocks the
   entire behaviour/audit/safeguarding layer at runtime. Then run `<scratchpad>/gate_test.py`
   → expect ALL PASS. *(James — blocker #1. Re-confirmed 2026-07-07: prod still runs the
   pre-school-layer rag-chat v209.)*
2. **🟠 #8 `skill_events` population** — nothing writes it → skill bars empty. Needs a real
   design: derive a per-skill 0–1 signal (KAA/EVAL/DIAGRAM/APPLICATION) from essay-marker AO
   marks + coaching turns, written **server-side in rag-chat**. Undeployable-locally → build in
   the same batch as #1's redeploy.
3. **🟠 #4 Slice-3 completion:**
   - **Vertex `europe-west2` provider branch** — 🔴 blocked on GCP creds (blocker #2: project
     with Vertex AI enabled, service-account JSON `Vertex AI User`, confirm `gemini-2.5-flash`).
   - **Rules 6–7 output post-filter backstop** (currently directive-only) — the main unbuilt
     behaviour-layer piece.
   - **Weekly cap** (RPC is daily-only).
4. **🟠 #7 Slice-6 nuance** — ensure every surround tool respects usage-cap + server logging in
   school mode.
5. **🟠 Assignments + Reporting/export UI** — schema exists; build set-a-paper + review-transcript
   + SLT-exportable summary (doubles as pilot case study). Plus a **data-subject export/delete**
   routine for DPA completeness.
6. **⛔ #10 Materials ingestion** — deferred (base corpus reuse is the MVP). Full spec +
   unwired scaffolding ready in `docs/schools-materials-ingestion-plan.md`. Un-defer when a
   pilot school wants its own uploads.
7. **🟢 Pre-go-live hygiene:** gate the Materials tab to "coming soon" (uploads currently sit
   `pending` forever); **remove the demo school** (`Meridian Sixth Form (DEMO)` — re-run
   `seed_demo_school.py` wipe, or delete the row → cascades); confirm residency copy.

**Note:** items 2, 3(post-filter/weekly), and 4 are all edge-function work → **undeployable /
untestable locally** (no Deno/CLI here). Build them in one batch and have James deploy, then
verify with `gate_test.py` (+ `materials_test.py` if #10 is un-deferred).

---

## 8. Guardrails & standing decisions

- **Attempt gate: lenient, false-reject = sev-1.** Safeguarding: **recall over precision**; DSL
  routing bypasses the class teacher.
- **Residency claim** gated on Vertex cutover (see §5).
- **Sacred files** (explicit per-change sign-off): `productAccess.ts`, `stripe-webhook/**`,
  `create-checkout/**`, `migrations/**` (always a new timestamped file), any RLS,
  `AuthContext.tsx`.
- **Gotchas:** `src/components/ui/tabs.tsx` is **custom** (`<Tabs selected setSelected tabs>`),
  not shadcn — always `npm run build` after UI work (tsc misses missing-export errors). Repo
  `migrations/` had drifted from prod — verify prod state before assuming an apply.
- **Decide-and-flag calls:** null-`product_id` license grants access (single-product world);
  teachers/admins preview **ungated**, role-tagged out of analytics; school-material chunks use
  **`product_id = NULL`** as a structural cross-school leak guard (see materials sub-plan).

---

## 9. How to resume

1. Read this file + `SCHOOLS_B2B_HANDOVER.md`. Confirm the scratchpad secrets/scripts still
   exist (`.sb-secrets.env`, `apply_migration.py`, `gate_test.py`, `seed_demo_school.py`,
   `verify_access_pair.py`) or ask James to re-provide.
2. **If James has deployed `rag-chat`:** run `gate_test.py` → then pick up §7 items 2–5 as an
   edge-function batch.
3. **If Vertex creds arrived:** do the §5 provider branch (slice 3).
4. **Otherwise:** the buildable-blind work is limited — §7 items 2/3(post-filter)/4/5 can be
   *written* but not verified until deploy. Confirm scope with James before building blind.
</content>
