INSERT INTO public.user_roles (user_id, role)
VALUES ('0d89771c-f64e-46a5-a274-b6898a2fa5b9', 'trainer')
ON CONFLICT (user_id, role) DO NOTHING;