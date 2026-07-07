-- =============================================================================
-- Migration: A*AI Schools — B2B institutional layer
-- Date: 2026-07-07
-- =============================================================================
-- CONSOLIDATED. Folds in the never-applied `20260408100100_school_licensing`
-- + `20260409100000` school tables (confirmed absent from production 2026-07-07
-- via REST probe; the 04-09 file also used invalid `CREATE POLICY IF NOT EXISTS`)
-- together with the new B2B grain (classes, per-class AI settings, server-written
-- audit log, skill tracking, safeguarding, assignments, school materials).
--
-- Prerequisites already in prod (verified): app_role enum, user_roles, has_role(),
-- update_updated_at_column(), products, auth.users.
--
-- Purely additive. Touches no B2C table. School-scoped roles live on membership
-- rows (TEXT), NOT the global app_role enum. All new RLS uses SECURITY DEFINER
-- helpers to avoid the self-referential-subquery recursion in the original draft.
-- =============================================================================

-- ── 0. Extend global app_role enum (platform-level roles; separate statements,
--       values are NOT referenced elsewhere in this migration so this is txn-safe)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- =============================================================================
-- 1. CORE SCHOOL STRUCTURE  (folded from the never-applied school_licensing)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.schools (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name  TEXT,
  -- Branding (net-new: the brief assumed this existed; it did not)
  logo_url      TEXT,
  primary_color TEXT,
  -- Safeguarding: DSL contact captured at onboarding (§4)
  dsl_name      TEXT,
  dsl_email     TEXT,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.school_licenses (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id              UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id             UUID REFERENCES public.products(id),   -- which product the seats unlock
  total_seats            INTEGER NOT NULL DEFAULT 30,
  used_seats             INTEGER NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT,
  plan_type              TEXT NOT NULL DEFAULT 'annual' CHECK (plan_type IN ('annual','termly')),
  price_per_seat         INTEGER NOT NULL DEFAULT 0,
  starts_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at             TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '1 year'),
  active                 BOOLEAN NOT NULL DEFAULT true,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.school_licenses ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.school_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id     UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  license_id    UUID REFERENCES public.school_licenses(id) ON DELETE SET NULL,
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role          TEXT NOT NULL DEFAULT 'student'
                  CHECK (role IN ('admin','teacher','student','dsl')),  -- +dsl (net-new)
  invited_email TEXT,
  invite_code   TEXT UNIQUE,
  invite_status TEXT NOT NULL DEFAULT 'pending'
                  CHECK (invite_status IN ('pending','accepted','expired')),
  joined_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_school_members_school       ON public.school_members(school_id);
CREATE INDEX IF NOT EXISTS idx_school_members_user         ON public.school_members(user_id);
CREATE INDEX IF NOT EXISTS idx_school_members_invite       ON public.school_members(invite_code);
CREATE INDEX IF NOT EXISTS idx_school_members_user_status  ON public.school_members(user_id, invite_status);
CREATE INDEX IF NOT EXISTS idx_school_licenses_school      ON public.school_licenses(school_id);

-- =============================================================================
-- 2. CLASS GRAIN  (net-new: schools → classes → students)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.classes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id          UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  name               TEXT NOT NULL,
  qualification_type TEXT NOT NULL DEFAULT 'A Level',
  spec_focus         TEXT,                       -- e.g. '9EC0'
  teacher_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_classes_school  ON public.classes(school_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON public.classes(teacher_id);

CREATE TABLE IF NOT EXISTS public.class_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id   UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('teacher','student')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (class_id, user_id)
);
ALTER TABLE public.class_members ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_class_members_class ON public.class_members(class_id);
CREATE INDEX IF NOT EXISTS idx_class_members_user  ON public.class_members(user_id);

-- Per-class AI tuning (§6 AI tunability). One row per class.
CREATE TABLE IF NOT EXISTS public.class_ai_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id             UUID NOT NULL UNIQUE REFERENCES public.classes(id) ON DELETE CASCADE,
  scaffolding_tightness TEXT NOT NULL DEFAULT 'standard'
                          CHECK (scaffolding_tightness IN ('light','standard','strict')),
  writing_aid_unlocked  BOOLEAN NOT NULL DEFAULT false,   -- default LOCKED (§3.5)
  blocked_topics        TEXT[] NOT NULL DEFAULT '{}',
  daily_cap             INTEGER,                          -- null = no cap
  weekly_cap            INTEGER,
  updated_by            UUID REFERENCES auth.users(id),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.class_ai_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 3. AUDIT LOG  (§4 — server-written; client cannot write, so students can't
--    avoid persistence. school_id denormalised for single-check RLS.)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.coach_interactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id        UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id         UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  product_id       UUID REFERENCES public.products(id),
  role             TEXT NOT NULL DEFAULT 'student',
  prompt           TEXT NOT NULL,
  response         TEXT,
  sources          JSONB NOT NULL DEFAULT '[]'::jsonb,   -- grounded corpus refs (§3.10)
  offload_score    NUMERIC,                              -- §3.4 cognitive offloading
  attempt_detected BOOLEAN,                              -- §3.2 attempt-first gate
  disclosure_state TEXT,                                 -- which gate step this turn was
  tokens_in        INTEGER,
  tokens_out       INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.coach_interactions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_coach_interactions_user    ON public.coach_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_interactions_school  ON public.coach_interactions(school_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_coach_interactions_class   ON public.coach_interactions(class_id, created_at DESC);

-- Per-interaction skill signal (§6 skill diagnostic)
CREATE TABLE IF NOT EXISTS public.skill_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id       UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES public.coach_interactions(id) ON DELETE SET NULL,
  skill          TEXT NOT NULL CHECK (skill IN ('KAA','EVALUATION','DIAGRAM','APPLICATION')),
  topic          TEXT,
  spec_ref       TEXT,
  signal         NUMERIC,   -- normalised competency signal for this event
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.skill_events ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_skill_events_user   ON public.skill_events(user_id, skill);
CREATE INDEX IF NOT EXISTS idx_skill_events_school ON public.skill_events(school_id, created_at DESC);

-- =============================================================================
-- 4. SAFEGUARDING  (§4 — DSL-scoped; routed to DSL, NOT the class teacher)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.safeguarding_flags (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  school_id      UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  class_id       UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  interaction_id UUID REFERENCES public.coach_interactions(id) ON DELETE SET NULL,
  severity       TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high')),
  category       TEXT,
  excerpt        TEXT,
  status         TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','ack','closed')),
  raised_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  dsl_ack_at     TIMESTAMPTZ,
  dsl_ack_by     UUID REFERENCES auth.users(id)
);
ALTER TABLE public.safeguarding_flags ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_safeguarding_school_status ON public.safeguarding_flags(school_id, status);

-- =============================================================================
-- 5. ASSIGNMENTS  (§6 — attempt + transcript, not just output)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.assignments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id     UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  school_id    UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  created_by   UUID REFERENCES auth.users(id),
  title        TEXT NOT NULL,
  question_ref TEXT,          -- past-paper reference, e.g. '9EC0/01 Jun2024 Q6'
  marks        INTEGER,
  instructions TEXT,
  due_at       TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_assignments_class ON public.assignments(class_id);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id  UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_text   TEXT,
  transcript_ref UUID REFERENCES public.coach_interactions(id) ON DELETE SET NULL,
  status         TEXT NOT NULL DEFAULT 'assigned'
                   CHECK (status IN ('assigned','in_progress','submitted')),
  submitted_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student    ON public.assignment_submissions(student_id);

-- =============================================================================
-- 6. SCHOOL MATERIALS  (§5 — school's own mark schemes/mocks → document_chunks
--    with metadata.school_id, referenced alongside our corpus)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.school_materials (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id         UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  product_id        UUID REFERENCES public.products(id),
  uploaded_by       UUID REFERENCES auth.users(id),
  title             TEXT NOT NULL,
  material_type     TEXT,       -- 'mark_scheme' | 'mock_paper' | 'house_style' ...
  file_url          TEXT,
  processing_status TEXT NOT NULL DEFAULT 'pending',
  chunks_created    INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.school_materials ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_school_materials_school ON public.school_materials(school_id);

-- =============================================================================
-- 7. SECURITY DEFINER HELPERS  (mirror has_role(); avoid RLS recursion)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_school_member(_user uuid, _school uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE user_id = _user AND school_id = _school AND invite_status = 'accepted'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_school_role(_user uuid, _school uuid, _roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE user_id = _user AND school_id = _school
      AND role = ANY(_roles) AND invite_status = 'accepted'
  )
$$;

CREATE OR REPLACE FUNCTION public.class_school(_class uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT school_id FROM public.classes WHERE id = _class
$$;

CREATE OR REPLACE FUNCTION public.is_class_teacher(_user uuid, _class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.classes c
    WHERE c.id = _class AND (
      c.teacher_id = _user
      OR EXISTS (SELECT 1 FROM public.class_members cm
                 WHERE cm.class_id = _class AND cm.user_id = _user AND cm.role = 'teacher')
    )
  )
$$;

CREATE OR REPLACE FUNCTION public.in_class(_user uuid, _class uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.class_members WHERE class_id = _class AND user_id = _user
  )
$$;

-- =============================================================================
-- 8. RLS POLICIES  (least-privilege: student=own, teacher=their classes,
--    admin/dsl=whole school. Server writes via service_role, which bypasses RLS.)
-- =============================================================================

-- schools: any accepted member may read (students need branding); admins update
CREATE POLICY "Members can view their school"
  ON public.schools FOR SELECT
  USING (public.is_school_member(auth.uid(), id));
CREATE POLICY "School admins can update their school"
  ON public.schools FOR UPDATE
  USING (public.has_school_role(auth.uid(), id, ARRAY['admin']));

-- school_licenses
CREATE POLICY "Staff can view licenses"
  ON public.school_licenses FOR SELECT
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher','dsl']));
CREATE POLICY "School admins can update licenses"
  ON public.school_licenses FOR UPDATE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin']));

-- school_members
CREATE POLICY "Members can view own school membership"
  ON public.school_members FOR SELECT
  USING (user_id = auth.uid()
         OR public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher','dsl']));
CREATE POLICY "School admins can insert members"
  ON public.school_members FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), school_id, ARRAY['admin']));
CREATE POLICY "School admins can delete members"
  ON public.school_members FOR DELETE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin']));

-- classes
CREATE POLICY "Staff and enrolled students can view classes"
  ON public.classes FOR SELECT
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher','dsl'])
         OR public.in_class(auth.uid(), id));
CREATE POLICY "Staff can insert classes"
  ON public.classes FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher']));
CREATE POLICY "Staff can update classes"
  ON public.classes FOR UPDATE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher']));
CREATE POLICY "School admins can delete classes"
  ON public.classes FOR DELETE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin']));

-- class_members
CREATE POLICY "View class members"
  ON public.class_members FOR SELECT
  USING (user_id = auth.uid()
         OR public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher','dsl']));
CREATE POLICY "Teachers manage class members (insert)"
  ON public.class_members FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher']));
CREATE POLICY "Teachers manage class members (delete)"
  ON public.class_members FOR DELETE
  USING (public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher']));

-- class_ai_settings
CREATE POLICY "Staff can view class AI settings"
  ON public.class_ai_settings FOR SELECT
  USING (public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher','dsl']));
CREATE POLICY "Teachers can insert class AI settings"
  ON public.class_ai_settings FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher']));
CREATE POLICY "Teachers can update class AI settings"
  ON public.class_ai_settings FOR UPDATE
  USING (public.has_school_role(auth.uid(), public.class_school(class_id), ARRAY['admin','teacher']));

-- coach_interactions: own OR class-teacher OR school admin/dsl. NO client insert.
CREATE POLICY "View coach interactions"
  ON public.coach_interactions FOR SELECT
  USING (user_id = auth.uid()
         OR public.has_school_role(auth.uid(), school_id, ARRAY['admin','dsl'])
         OR (class_id IS NOT NULL AND public.is_class_teacher(auth.uid(), class_id)));

-- skill_events: same visibility as interactions. NO client insert.
CREATE POLICY "View skill events"
  ON public.skill_events FOR SELECT
  USING (user_id = auth.uid()
         OR public.has_school_role(auth.uid(), school_id, ARRAY['admin','dsl'])
         OR (class_id IS NOT NULL AND public.is_class_teacher(auth.uid(), class_id)));

-- safeguarding_flags: DSL + admin ONLY (not class teachers). NO client insert.
CREATE POLICY "DSL and admin can view safeguarding flags"
  ON public.safeguarding_flags FOR SELECT
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['dsl','admin']));
CREATE POLICY "DSL and admin can update safeguarding flags"
  ON public.safeguarding_flags FOR UPDATE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['dsl','admin']));

-- assignments
CREATE POLICY "Staff and enrolled students can view assignments"
  ON public.assignments FOR SELECT
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher','dsl'])
         OR public.in_class(auth.uid(), class_id));
CREATE POLICY "Teachers can insert assignments"
  ON public.assignments FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher']));
CREATE POLICY "Teachers can update assignments"
  ON public.assignments FOR UPDATE
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher']));

-- assignment_submissions: student owns their submission; class teacher/admin can read
CREATE POLICY "View submissions"
  ON public.assignment_submissions FOR SELECT
  USING (student_id = auth.uid()
         OR public.is_class_teacher(auth.uid(), (SELECT class_id FROM public.assignments WHERE id = assignment_id))
         OR public.has_school_role(auth.uid(), (SELECT school_id FROM public.assignments WHERE id = assignment_id), ARRAY['admin']));
CREATE POLICY "Students insert own submission"
  ON public.assignment_submissions FOR INSERT
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "Students update own submission"
  ON public.assignment_submissions FOR UPDATE
  USING (student_id = auth.uid());

-- school_materials: staff only
CREATE POLICY "Staff can view school materials"
  ON public.school_materials FOR SELECT
  USING (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher','dsl']));
CREATE POLICY "Teachers can insert school materials"
  ON public.school_materials FOR INSERT
  WITH CHECK (public.has_school_role(auth.uid(), school_id, ARRAY['admin','teacher']));

-- =============================================================================
-- 9. updated_at triggers (reuse existing public.update_updated_at_column())
-- =============================================================================
CREATE TRIGGER trg_schools_updated_at            BEFORE UPDATE ON public.schools            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_classes_updated_at            BEFORE UPDATE ON public.classes            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_class_ai_settings_updated_at  BEFORE UPDATE ON public.class_ai_settings  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_assignments_updated_at        BEFORE UPDATE ON public.assignments        FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_submissions_updated_at        BEFORE UPDATE ON public.assignment_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- 10. STORAGE BUCKETS  (branding = public read; materials = private)
-- =============================================================================
INSERT INTO storage.buckets (id, name, public)
  VALUES ('school-branding', 'school-branding', true)
  ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public)
  VALUES ('school-materials', 'school-materials', false)
  ON CONFLICT (id) DO NOTHING;

-- Branding: any authenticated staff can upload their school's logo; public read (bucket is public)
CREATE POLICY "Staff can upload school branding"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-branding');
-- School materials: staff upload + read only (private bucket)
CREATE POLICY "Staff can upload school materials"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-materials');
CREATE POLICY "Staff can read school materials"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'school-materials');
