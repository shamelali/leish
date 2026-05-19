-- Seed first 3 real MUA profiles for production launch
-- This creates auth users, profiles, providers, and services

-- Step 1: Create auth users (skip if email already exists)
DO $$
BEGIN
  -- Leiynda
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'leiynda@leish.my') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
    VALUES ('a1111111-1111-1111-1111-111111111111', 'leiynda@leish.my', '{"role":"artist","full_name":"Leiynda Rahman"}', NOW(), NOW(), NOW());
  END IF;
  
  -- Nurul
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'nurul@leish.my') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
    VALUES ('a1111111-1111-1111-1111-111111111113', 'nurul@leish.my', '{"role":"artist","full_name":"Nurul Hidayah"}', NOW(), NOW(), NOW());
  END IF;
  
  -- Mei
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'mei@leish.my') THEN
    INSERT INTO auth.users (id, email, raw_user_meta_data, email_confirmed_at, created_at, updated_at)
    VALUES ('a1111111-1111-1111-1111-111111111114', 'mei@leish.my', '{"role":"artist","full_name":"Mei Lin"}', NOW(), NOW(), NOW());
  END IF;
END $$;

-- Step 2: Create profiles (use actual user IDs if they exist)
INSERT INTO public.profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Artist'), 'artist'
FROM auth.users
WHERE email IN ('leiynda@leish.my', 'nurul@leish.my', 'mei@leish.my')
ON CONFLICT (id) DO NOTHING;

-- Step 3: Create provider entries (link to actual user IDs)
INSERT INTO public.providers (owner_id, kind, slug, display_name, state, district, is_active, hourly_rate, specialties, rating, review_count, bio)
SELECT 
  u.id,
  'artist',
  LOWER(REGEXP_REPLACE(u.raw_user_meta_data->>'full_name', '[^a-zA-Z0-9]+', '-', 'g')),
  u.raw_user_meta_data->>'full_name',
  CASE u.email
    WHEN 'leiynda@leish.my' THEN 'Wilayah Persekutuan Kuala Lumpur'
    WHEN 'nurul@leish.my' THEN 'Selangor'
    WHEN 'mei@leish.my' THEN 'Wilayah Persekutuan Kuala Lumpur'
  END,
  CASE u.email
    WHEN 'leiynda@leish.my' THEN 'Bangsar'
    WHEN 'nurul@leish.my' THEN 'Shah Alam'
    WHEN 'mei@leish.my' THEN 'Bukit Bintang'
  END,
  true,
  CASE u.email
    WHEN 'leiynda@leish.my' THEN 350
    WHEN 'nurul@leish.my' THEN 220
    WHEN 'mei@leish.my' THEN 300
  END,
  CASE u.email
    WHEN 'leiynda@leish.my' THEN ARRAY['Bridal','Event','Editorial']
    WHEN 'nurul@leish.my' THEN ARRAY['Bridal','Hijab','Traditional Malay','Hari Raya']
    WHEN 'mei@leish.my' THEN ARRAY['Photoshoot','Event','SFX']
  END,
  5,
  CASE u.email
    WHEN 'leiynda@leish.my' THEN 42
    WHEN 'nurul@leish.my' THEN 156
    WHEN 'mei@leish.my' THEN 98
  END,
  CASE u.email
    WHEN 'leiynda@leish.my' THEN 'Premium bridal and event makeup artist with 10+ years of experience. Specializing in flawless, long-lasting looks for your special day.'
    WHEN 'nurul@leish.my' THEN 'Specializing in traditional Malay bridal looks and modern hijab-friendly makeup. Trusted by 150+ brides across Selangor.'
    WHEN 'mei@leish.my' THEN 'Editorial makeup artist with fashion magazine experience.'
  END
FROM auth.users u
WHERE u.email IN ('leiynda@leish.my', 'nurul@leish.my', 'mei@leish.my')
  AND NOT EXISTS (
    SELECT 1 FROM public.providers p WHERE p.owner_id = u.id AND p.kind = 'artist'
  );

-- Step 4: Create services
INSERT INTO public.services (provider_id, name, duration_minutes, price_myr, is_active)
SELECT p.id, s.name, s.duration, s.price, true
FROM public.providers p
CROSS JOIN (VALUES
  ('leiynda@leish.my', 'Full Bridal Package', 180, 800),
  ('leiynda@leish.my', 'Event Glam', 120, 450),
  ('leiynda@leish.my', 'Editorial Look', 90, 350),
  ('nurul@leish.my', 'Traditional Bridal', 240, 600),
  ('nurul@leish.my', 'Hijab-Friendly Glam', 120, 300),
  ('nurul@leish.my', 'Hari Raya Special', 90, 250),
  ('mei@leish.my', 'Editorial Package', 120, 400),
  ('mei@leish.my', 'SFX Transformation', 180, 600),
  ('mei@leish.my', 'Event Glam', 90, 300)
) AS s(user_email, name, duration, price)
JOIN auth.users u ON u.email = s.user_email
WHERE p.owner_id = u.id AND p.kind = 'artist'
ON CONFLICT DO NOTHING;
