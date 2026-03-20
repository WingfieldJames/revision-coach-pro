INSERT INTO public.user_roles (user_id, role)
VALUES ('a1414ada-6af7-48bd-b999-e553ad210453', 'trainer')
ON CONFLICT (user_id, role) DO NOTHING;