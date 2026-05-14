-- Supabase Staging Seed Script (copy & paste into SQL Editor)
-- Creates 4 test users with auth + profiles

-- UUIDs for test users (predefined for consistency)
-- You can regenerate via: SELECT gen_random_uuid();

-- 1. ARTIST USER
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_sso_user, confirmation_token, email_change, recovery_token)
VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'artist@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"artist"}',
  false,
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role)
VALUES ('11111111-1111-1111-1111-111111111111'::uuid, 'Artist Owner', 'artist'::public.profile_role)
ON CONFLICT (id) DO UPDATE SET full_name = 'Artist Owner';

---

-- 2. CUSTOMER USER
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_sso_user, confirmation_token, email_change, recovery_token)
VALUES (
  '22222222-2222-2222-2222-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'customer@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"customer"}',
  false,
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role)
VALUES ('22222222-2222-2222-2222-222222222222'::uuid, 'Sample Customer', 'customer'::public.profile_role)
ON CONFLICT (id) DO UPDATE SET full_name = 'Sample Customer';

---

-- 3. ADMIN USER
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_sso_user, confirmation_token, email_change, recovery_token)
VALUES (
  '33333333-3333-3333-3333-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"admin"}',
  false,
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role)
VALUES ('33333333-3333-3333-3333-333333333333'::uuid, 'Admin User', 'admin'::public.profile_role)
ON CONFLICT (id) DO UPDATE SET full_name = 'Admin User';

---

-- 4. STUDIO USER
INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_user_meta_data, is_sso_user, confirmation_token, email_change, recovery_token)
VALUES (
  '44444444-4444-4444-4444-444444444444'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'studio@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"role":"studio_manager"}',
  false,
  '',
  '',
  ''
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role)
VALUES ('44444444-4444-4444-4444-444444444444'::uuid, 'Studio Owner', 'studio_manager'::public.profile_role)
ON CONFLICT (id) DO UPDATE SET full_name = 'Studio Owner';

---

-- VERIFY: List all test users
SELECT id, email, created_at FROM auth.users WHERE email LIKE '%@example.com' ORDER BY created_at;

-- Done! You can now sign in with:
-- Email: artist@example.com, Password: password123
-- Email: customer@example.com, Password: password123
-- Email: admin@example.com, Password: password123
-- Email: studio@example.com, Password: password123
