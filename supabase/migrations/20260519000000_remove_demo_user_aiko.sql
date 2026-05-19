-- Remove demo/seed user "Aiko Nakamura" from production and local environments

-- Delete provider rows
DELETE FROM public.providers WHERE slug = 'aiko-nakamura';

-- Delete profile and auth user for production ID
DELETE FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000002';
DELETE FROM auth.users WHERE id = 'a0000000-0000-0000-0000-000000000002';

-- Delete profile and auth user for local dev ID
DELETE FROM public.profiles WHERE id = '11111111-1111-1111-1111-111111111111';
DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';
