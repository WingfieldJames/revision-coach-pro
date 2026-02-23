
-- 1. Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'user');

-- 2. Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- 4. RLS policies for user_roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 5. Create trainer_projects table
CREATE TABLE public.trainer_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) DEFAULT NULL,
  subject text NOT NULL,
  exam_board text NOT NULL,
  system_prompt text DEFAULT '',
  exam_technique text DEFAULT '',
  custom_sections jsonb DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_projects ENABLE ROW LEVEL SECURITY;

-- Trainers and admins can do everything on trainer_projects
CREATE POLICY "Trainers can view projects"
  ON public.trainer_projects FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert projects"
  ON public.trainer_projects FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can update projects"
  ON public.trainer_projects FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

-- Auto-update updated_at
CREATE TRIGGER update_trainer_projects_updated_at
  BEFORE UPDATE ON public.trainer_projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Create trainer_uploads table
CREATE TABLE public.trainer_uploads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid REFERENCES public.trainer_projects(id) ON DELETE CASCADE NOT NULL,
  section_type text NOT NULL,
  year text,
  file_name text NOT NULL,
  file_url text NOT NULL,
  processing_status text NOT NULL DEFAULT 'pending',
  chunks_created integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trainer_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Trainers can view uploads"
  ON public.trainer_uploads FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can insert uploads"
  ON public.trainer_uploads FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Trainers can update uploads"
  ON public.trainer_uploads FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'));

-- 7. Create trainer-uploads storage bucket (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('trainer-uploads', 'trainer-uploads', false);

-- 8. Storage RLS policies
CREATE POLICY "Trainers can upload files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'trainer-uploads'
    AND (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'))
  );

CREATE POLICY "Trainers can read files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'trainer-uploads'
    AND (public.has_role(auth.uid(), 'trainer') OR public.has_role(auth.uid(), 'admin'))
  );
