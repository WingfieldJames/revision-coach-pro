INSERT INTO public.user_roles (user_id, role)
VALUES ('7e64a02c-525f-44fa-8c2d-da93fec3e9c7', 'trainer')
ON CONFLICT (user_id, role) DO NOTHING;