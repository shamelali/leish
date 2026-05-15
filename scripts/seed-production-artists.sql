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

-- Step 4: Create services for each artist
INSERT INTO public.services (provider_id, name, duration_minutes, price_myr, is_active, description)
SELECT p.id, s.name, s.duration, s.price, true, s.description
FROM (VALUES
  -- Leiynda services
  ('leiynda-rahman', 'Bridal Signature Look', 150, 550, 'Full bridal makeup with trial session included. Touch-up kit provided.'),
  ('leiynda-rahman', 'Event Glam', 90, 350, 'Red carpet and event makeup. Long-lasting formula for 12+ hour wear.'),
  ('leiynda-rahman', 'Editorial/Photoshoot', 120, 450, 'High-definition makeup for photography and video. Camera-ready finish.'),
  -- Aiko services
  ('aiko-nakamura', 'Japanese Bridal', 150, 480, 'Soft, luminous J-beauty bridal look. Includes skin prep and setting.'),
  ('aiko-nakamura', 'Natural Everyday', 60, 200, 'Clean, minimal makeup for daily wear or casual events.'),
  ('aiko-nakamura', 'Engagement Ceremony', 120, 380, 'Elegant engagement look with focus on flawless base and soft eyes.'),
  -- Nurul services
  ('nurul-hidayah', 'Malay Bridal Traditional', 180, 420, 'Full traditional Malay bridal makeup with songkok-compatible styling.'),
  ('nurul-hidayah', 'Hijab-Friendly Glam', 90, 280, 'Makeup designed to complement hijab styles. Focus on eyes and complexion.'),
  ('nurul-hidayah', 'Hari Raya Special', 60, 220, 'Festive makeup for Raya celebrations. Quick turnaround, stunning results.')
) AS s(slug, name, duration, price, description)
JOIN public.providers p ON p.slug = s.slug;
