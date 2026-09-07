-- ============================================================================
-- Test baseline for the Studio Booking Engine integration suite.
--
-- The engine migration (supabase/migrations/20260907000000_studio_booking_engine.sql)
-- assumes a Supabase-shaped database. Running the *full* historical migration
-- chain needs Supabase's local stack; this baseline recreates ONLY the pieces
-- the engine actually depends on (tables + enums copied from the real core
-- migrations) plus minimal stubs for Supabase's `auth` schema, so the engine
-- can be integration-tested against a bare Postgres (CI service container or
-- a local TEST_DATABASE_URL).
--
-- Kept deliberately small: types + tables only (no legacy RLS policies /
-- triggers) because the engine functions are SECURITY DEFINER and create their
-- own policies. Tables/enums mirror these real migrations:
--   supabase/migrations/20260222100000_marketplace_core.sql
--   supabase/migrations/20260304160000_reapply_core.sql
--   supabase/migrations/20260517000001_studio_rooms_gallery.sql
-- ============================================================================

-- ---- Supabase stubs (auth) -------------------------------------------------
create schema if not exists auth;

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role;
  end if;
end
$$;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  phone text,
  raw_user_meta_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function auth.uid() returns uuid
language sql stable
as $$ select null::uuid $$;

create or replace function auth.jwt() returns jsonb
language sql stable
as $$ select '{}'::jsonb $$;

grant execute on function auth.uid() to anon, authenticated, service_role;

-- ---- Enums (mirror public schema enums the engine reads) -------------------
create type public.profile_role as enum ('admin', 'artist', 'studio_manager', 'customer');
create type public.booking_status as enum (
  'pending', 'payment_required', 'confirmed', 'paid_deposit',
  'paid_full', 'canceled', 'completed', 'refunded'
);

-- ---- Core tables the engine reads/writes -----------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.profile_role not null default 'customer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.providers (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('artist', 'studio')),
  slug text not null unique,
  display_name text not null,
  state text not null,
  district text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  duration_minutes integer not null check (duration_minutes > 0),
  price_myr integer not null check (price_myr >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now(),
  constraint valid_time_range check (ends_at > starts_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.providers(id) on delete restrict,
  service_id uuid references public.services(id) on delete restrict,
  slot_id uuid references public.availability_slots(id) on delete restrict,
  status public.booking_status not null default 'pending',
  notes text,
  total_amount_myr numeric not null default 0 check (total_amount_myr >= 0),
  paid_amount_myr numeric not null default 0 check (paid_amount_myr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.studio_rooms (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.providers(id) on delete cascade,
  name text not null,
  description text,
  capacity text,
  price_per_hour numeric(10,2) not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
