-- Add 'school_admin' and 'teacher' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'school_admin';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'teacher';

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_name TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

-- School licenses
CREATE TABLE public.school_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  total_seats INTEGER NOT NULL DEFAULT 30,
  used_seats INTEGER NOT NULL DEFAULT 0,
  stripe_subscription_id TEXT,
  plan_type TEXT NOT NULL DEFAULT 'annual' CHECK (plan_type IN ('annual', 'termly')),
  price_per_seat INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 year'),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.school_licenses ENABLE ROW LEVEL SECURITY;

-- School members (teachers + students linked to a school)
CREATE TABLE public.school_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  license_id UUID REFERENCES public.school_licenses(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'teacher', 'student')),
  invited_email TEXT,
  invite_code TEXT UNIQUE,
  invite_status TEXT NOT NULL DEFAULT 'pending' CHECK (invite_status IN ('pending', 'accepted', 'expired')),
  joined_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_school_members_school ON public.school_members(school_id);
CREATE INDEX idx_school_members_user ON public.school_members(user_id);
CREATE INDEX idx_school_members_invite ON public.school_members(invite_code);
CREATE INDEX idx_school_licenses_school ON public.school_licenses(school_id);

-- RLS Policies
CREATE POLICY "School admins and teachers can view their school"
  ON public.schools FOR SELECT
  USING (id IN (SELECT school_id FROM public.school_members WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "School admins and teachers can view licenses"
  ON public.school_licenses FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.school_members WHERE user_id = auth.uid() AND role IN ('admin', 'teacher')));

CREATE POLICY "School admins and teachers can view members"
  ON public.school_members FOR SELECT
  USING (school_id IN (SELECT school_id FROM public.school_members sm WHERE sm.user_id = auth.uid() AND sm.role IN ('admin', 'teacher')) OR user_id = auth.uid());

CREATE POLICY "School admins can insert members"
  ON public.school_members FOR INSERT
  WITH CHECK (school_id IN (SELECT school_id FROM public.school_members sm WHERE sm.user_id = auth.uid() AND sm.role = 'admin'));

CREATE POLICY "School admins can delete members"
  ON public.school_members FOR DELETE
  USING (school_id IN (SELECT school_id FROM public.school_members sm WHERE sm.user_id = auth.uid() AND sm.role = 'admin'));
