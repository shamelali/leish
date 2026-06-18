-- ensure core marketplace tables exist in case earlier migration failed

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

create unique index if not exists availability_slot_unique
  on public.availability_slots(provider_id, starts_at, ends_at);

-- Ensure bookings table has all required columns (handles case where table exists but is incomplete)
create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete restrict,
  provider_id uuid not null references public.providers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  slot_id uuid not null references public.availability_slots(id) on delete restrict,
  status public.booking_status not null default 'pending',
  notes text,
  total_amount_myr integer not null check (total_amount_myr >= 0),
  paid_amount_myr integer not null default 0 check (paid_amount_myr >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Note: unique index on slot_id will be created in a follow-up migration if needed

create table if not exists public.booking_events (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  event_type text not null,
  event_payload jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  provider text not null default 'stripe',
  payment_intent_id text unique,
  status public.payment_status not null default 'requires_payment_method',
  amount_myr integer not null check (amount_myr >= 0),
  currency text not null default 'MYR',
  webhook_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  title text,
  body text not null,
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_events enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
