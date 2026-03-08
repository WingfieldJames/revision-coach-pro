INSERT INTO public.user_roles (user_id, role)
VALUES ('abd067af-b9f4-431d-8612-e44bd649a579', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;