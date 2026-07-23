-- University Applications (FirmChoice port) — catalogue + per-user state.
--
-- Merges FirmChoice's supabase/schema.sql + migrations 0001–0003 into A*AI,
-- with every table prefixed uni_ to keep the new surface auditable. Catalogue
-- tables are public facts loaded by scripts/load-uni-courses.mjs (service
-- role); per-user tables are RLS-scoped to auth.uid().

-- One row per target university (28 hand-curated institutions).
create table if not exists public.uni_institutions (
  ukprn          text primary key,            -- UK Provider Reference Number
  name           text not null,               -- LEGAL_NAME from INSTITUTION.csv
  short_name     text,                        -- friendly short form (e.g. "LSE")
  city           text,
  region         text,
  russell_group  boolean,
  cug_rank_2026  int,                         -- Complete University Guide 2026; null on load
  website        text                         -- PROVURL from INSTITUTION.csv
);

-- One row per course (full-time honours, KISMODE=01) at a target institution.
create table if not exists public.uni_courses (
  id              uuid primary key default gen_random_uuid(),
  ukprn           text references public.uni_institutions (ukprn),

  -- Natural key from Discover Uni (KISCOURSE.csv); the load upserts on this.
  kiscourseid     text,
  kismode         text,

  -- Course identity, from KISCOURSE.csv.
  ucas_code       text,                       -- UCASPROGID
  title           text,                       -- TITLE
  qualification   text,                       -- parsed from TITLE if present, else null
  qual_level      text,                       -- parsed qualification, else raw KISLEVEL code
  crse_url        text,                       -- CRSEURL: the official course page

  discipline      text,                       -- tagged later, null on load
  cah_codes       text[],                     -- subject (CAH) tags from SBJ.csv

  -- HESA-derived, machine-loaded. Safe to refresh from the dataset.
  typical_tariff  int,

  -- Manually / web-sourced. A HESA refresh MUST NOT overwrite these.
  offer_alevel        text,
  offer_ib            text,
  required_subjects   text,
  admissions_test     text,
  contextual_offer    text,
  success_rate        numeric,
  source_url          text,
  verified_date       date,
  verification_status text default 'unverified',  -- unverified | verified | needs_review
  notes               text,

  created_at      timestamptz default now(),

  unique (ukprn, kiscourseid, kismode)
);

create index if not exists uni_courses_ukprn_idx on public.uni_courses (ukprn);
create index if not exists uni_courses_discipline_idx on public.uni_courses (discipline);

-- One row per user holding every stage's persisted blob. Payloads are opaque
-- JSON the app never queries inside, so a column per stage is enough.
create table if not exists public.uni_app_state (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  match_inputs         jsonb,        -- MatchInputs    (match)
  results_final        jsonb,        -- FinalCourse[]  (results)
  results_ranking      jsonb,        -- cached model order + reasons; avoids re-spending Claude calls
  prepare_pool         jsonb,        -- ActivityCard[] (prepare)
  write_draft          jsonb,        -- PsDraft        (write)
  organise_arrangement jsonb,        -- Columns        (organise)
  updated_at           timestamptz not null default now()
);

-- Durable, accumulating student profile derived server-side from the stages.
-- `summary` is the compact paragraph injected into Claude prompts.
create table if not exists public.uni_student_profile (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  academic   jsonb,        -- { subjects, aLevels }
  interests  jsonb,        -- { freeText, themes }
  activities jsonb,        -- distilled activity reflections (capped)
  writing    jsonb,        -- writing-style signals
  summary    text,         -- <= 600-char natural-language summary for prompts
  updated_at timestamptz not null default now()
);

-- RLS: catalogue tables are public read-only (writes only via service role,
-- which bypasses RLS); per-user tables are scoped to the owning user.
alter table public.uni_institutions enable row level security;
alter table public.uni_courses enable row level security;
alter table public.uni_app_state enable row level security;
alter table public.uni_student_profile enable row level security;

create policy "uni_institutions public read" on public.uni_institutions
  for select using (true);

create policy "uni_courses public read" on public.uni_courses
  for select using (true);

create policy "own uni_app_state select" on public.uni_app_state
  for select using (auth.uid() = user_id);
create policy "own uni_app_state insert" on public.uni_app_state
  for insert with check (auth.uid() = user_id);
create policy "own uni_app_state update" on public.uni_app_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own uni_student_profile select" on public.uni_student_profile
  for select using (auth.uid() = user_id);
create policy "own uni_student_profile insert" on public.uni_student_profile
  for insert with check (auth.uid() = user_id);
create policy "own uni_student_profile update" on public.uni_student_profile
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
