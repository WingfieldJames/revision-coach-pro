INSERT INTO public.user_roles (user_id, role) 
VALUES ('5facaae1-2c7d-4db3-acdc-7cb6419845b3', 'trainer') 
ON CONFLICT (user_id, role) DO NOTHING;