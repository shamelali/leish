-- Clean up orphan schema objects from Supabase template / other project
-- None of these are used by the Leish application

-- Drop FK constraints on space_id columns (Leish uses provider_id instead)
alter table public.services drop constraint if exists services_space_id_fkey;
alter table public.availability_slots drop constraint if exists availability_slots_space_id_fkey;

-- Drop space_id columns (unused by Leish)
alter table public.services drop column if exists space_id;
alter table public.availability_slots drop column if exists space_id;

-- Now drop orphan tables
drop table if exists public.studio_spaces cascade;
drop table if exists public.duta_notifications;
drop table if exists public.event_registrations cascade;
drop table if exists public.events cascade;
drop table if exists public.forum_replies cascade;
drop table if exists public.forum_threads;
drop table if exists public.housing_listings;
drop table if exists public.job_listings;
drop table if exists public.service_providers;

-- rate_limits and its function are unused (Leish uses in-memory rate limiting)
drop table if exists public.rate_limits cascade;
drop function if exists public.rate_limit_check;
