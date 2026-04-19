-- Add linkedin_url to trainer_projects
ALTER TABLE public.trainer_projects
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Grant trainer role to Arham if his auth user exists
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'trainer'::app_role FROM auth.users WHERE email = 'arham.shuaib@gmail.com'
ON CONFLICT DO NOTHING;