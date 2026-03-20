INSERT INTO public.user_roles (user_id, role)
VALUES ('ac2f1d07-888c-4932-a183-31898503e7b2', 'trainer')
ON CONFLICT (user_id, role) DO NOTHING;