-- Seed data for local development
-- Creates test profiles and providers

-- Test user IDs (matching Supabase UUID format for dev)
INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  ('11111111-1111-1111-1111-111111111111', 'artist1@leish.my', '{"role":"artist","full_name":"Aiko Nakamura"}'),
  ('22222222-2222-2222-2222-222222222222', 'artist2@leish.my', '{"role":"artist","full_name":"Mei Lin"}'),
  ('33333333-3333-3333-3333-333333333333', 'artist3@leish.my', '{"role":"artist","full_name":"Nurul Hidayah"}'),
  ('44444444-4444-4444-4444-444444444444', 'studio1@leish.my', '{"role":"studio_manager","full_name":"Studio One"}')
ON CONFLICT (id) DO NOTHING;

-- Profiles
INSERT INTO public.profiles (id, full_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Aiko Nakamura', 'artist'),
  ('22222222-2222-2222-2222-222222222222', 'Mei Lin', 'artist'),
  ('33333333-3333-3333-3333-333333333333', 'Nurul Hidayah', 'artist'),
  ('44444444-4444-4444-4444-444444444444', 'Studio One', 'studio_manager')
ON CONFLICT (id) DO NOTHING;

-- Providers (artists)
INSERT INTO public.providers (id, owner_id, kind, slug, display_name, state, district, is_active, hourly_rate, specialties, rating, review_count, bio, experience_years)
VALUES
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'artist', 'aiko-nakamura', 'Aiko Nakamura', 'Selangor', 'Petaling', true, 250, ARRAY['Bridal','Event','Natural'], 5, 127, 'Experienced bridal and event makeup artist.', 8),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'artist', 'mei-lin', 'Mei Lin', 'Wilayah Persekutuan Kuala Lumpur', 'Bukit Bintang', true, 300, ARRAY['Photoshoot','Event','SFX'], 5, 98, 'Editorial makeup artist with fashion magazine experience.', 6),
  ('c3333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333', 'artist', 'nurul-hidayah', 'Nurul Hidayah', 'Selangor', 'Shah Alam', true, 180, ARRAY['Hari Raya','Hijab','Traditional Malay'], 5, 156, 'Specializing in traditional Malay and festive makeup.', 7)
ON CONFLICT (id) DO NOTHING;

-- Provider (studio)
INSERT INTO public.providers (id, owner_id, kind, slug, display_name, state, district, is_active, hourly_rate, specialties)
VALUES
  ('d4444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444444', 'studio', 'studio-one', 'Studio One', 'Wilayah Persekutuan Kuala Lumpur', 'KLCC', false, 500, ARRAY['Bridal','Event','Photoshoot'])
ON CONFLICT (id) DO NOTHING;

-- Services
INSERT INTO public.services (provider_id, name, duration_minutes, price_myr, is_active)
SELECT p.id, s.name, s.duration, s.price, true
FROM (VALUES
  ('aiko-nakamura', 'Bridal Makeup', 120, 450),
  ('aiko-nakamura', 'Event Glam', 60, 300),
  ('aiko-nakamura', 'Trial Session', 90, 200),
  ('mei-lin', 'Editorial Shoot', 180, 500),
  ('mei-lin', 'Fashion Week', 480, 800),
  ('mei-lin', 'Red Carpet Glam', 90, 400),
  ('nurul-hidayah', 'Hari Raya Makeup', 90, 250),
  ('nurul-hidayah', 'Traditional Bridal', 150, 400),
  ('nurul-hidayah', 'Hijab Makeup', 60, 180)
) AS s(slug, name, duration, price)
JOIN public.providers p ON p.slug = s.slug;
