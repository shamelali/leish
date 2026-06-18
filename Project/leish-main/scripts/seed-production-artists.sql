-- Production seed: First 3 MUAs for Leish!
-- Run in Supabase SQL Editor: https://rmsjrhamjmupvrxqyagm.supabase.co/project/default/sql

-- Step 1: Create auth users (skip if already exist)
INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'leiynda@leish.my', '{"role":"artist","full_name":"Leiynda Rahman"}', NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000002', 'aiko@leish.my', '{"role":"artist","full_name":"Aiko Nakamura"}', NOW(), NOW(), NOW()),
  ('a0000000-0000-0000-0000-000000000003', 'nurul@leish.my', '{"role":"artist","full_name":"Nurul Hidayah"}', NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create profiles
INSERT INTO public.profiles (id, full_name, role, avatar_url)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Leiynda Rahman', 'artist', NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Aiko Nakamura', 'artist', NULL),
  ('a0000000-0000-0000-0000-000000000003', 'Nurul Hidayah', 'artist', NULL)
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create provider entries (these show up on browse page)
INSERT INTO public.providers (id, owner_id, kind, slug, display_name, state, district, is_active, hourly_rate, specialties, rating, review_count, bio, experience_years)
VALUES
  ('p0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'artist', 'leiynda-rahman', 'Leiynda Rahman', 'Wilayah Persekutuan Kuala Lumpur', 'Bangsar', true, 350, ARRAY['Bridal','Event','Editorial'], 5, 42, 'Premium bridal and event makeup artist with 10+ years of experience. Specializing in flawless, long-lasting looks for your special day.', 10),
  ('p0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'artist', 'aiko-nakamura', 'Aiko Nakamura', 'Selangor', 'Petaling Jaya', true, 280, ARRAY['Bridal','Natural','Japanese'], 5, 89, 'Japanese-trained makeup artist bringing K-beauty and J-beauty techniques to Malaysian brides. Known for soft, luminous finishes.', 8),
  ('p0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000003', 'artist', 'nurul-hidayah', 'Nurul Hidayah', 'Selangor', 'Shah Alam', true, 220, ARRAY['Bridal','Hijab','Traditional Malay','Hari Raya'], 5, 156, 'Specializing in traditional Malay bridal looks and modern hijab-friendly makeup. Trusted by 150+ brides across Selangor.', 7)
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create services (no description column exists in public.services)
INSERT INTO public.services (provider_id, name, duration_minutes, price_myr, is_active)
SELECT p.id, s.name, s.duration, s.price, true
FROM (VALUES
  ('leiynda-rahman', 'Bridal Signature Look', 150, 550),
  ('leiynda-rahman', 'Event Glam', 90, 350),
  ('leiynda-rahman', 'Editorial/Photoshoot', 120, 450),
  ('aiko-nakamura', 'Japanese Bridal', 150, 480),
  ('aiko-nakamura', 'Natural Everyday', 60, 200),
  ('aiko-nakamura', 'Engagement Ceremony', 120, 380),
  ('nurul-hidayah', 'Malay Bridal Traditional', 180, 420),
  ('nurul-hidayah', 'Hijab-Friendly Glam', 90, 280),
  ('nurul-hidayah', 'Hari Raya Special', 60, 220)
) AS s(slug, name, duration, price)
JOIN public.providers p ON p.slug = s.slug;
