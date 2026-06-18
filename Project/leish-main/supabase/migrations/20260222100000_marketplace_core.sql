-- Core marketplace schema for secure booking, payment, reviews, and pro dashboard.

create type public.profile_role as enum ('admin', 'artist', 'studio_manager', 'customer');
create type public.booking_status as enum (
  'pending',
  'payment_required',
  'confirmed',
  'paid_deposit',
  'paid_full',
  'canceled',
  'completed',
  'refunded'
);
create type public.payment_status as enum (
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
  'processing',
  'succeeded',
  'failed',
  'canceled',
  'refunded'
);
create type public.review_status as enum ('published', 'hidden', 'flagged');

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

create unique index if not exists bookings_slot_unique on public.bookings(slot_id);

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

-- Profiles
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id);

-- Providers/services/slots are public read for marketplace browsing.
create policy "providers: public read"
  on public.providers for select
  using (true);

create policy "services: public read"
  on public.services for select
  using (true);

create policy "availability: public read"
  on public.availability_slots for select
  using (true);

-- Provider owners can mutate their records.
create policy "providers: owner mutate"
  on public.providers for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "services: owner mutate"
  on public.services for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.owner_id = auth.uid()
    )
  );

create policy "availability: owner mutate"
  on public.availability_slots for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.owner_id = auth.uid()
    )
  );

-- Bookings/payments/reviews visibility.
create policy "bookings: customer or owner read"
  on public.bookings for select
  using (
    customer_id = auth.uid() or
    exists (
      select 1 from public.providers p
      where p.id = provider_id and p.owner_id = auth.uid()
    )
  );

create policy "bookings: customer create"
  on public.bookings for insert
  with check (customer_id = auth.uid());

create policy "booking_events: customer or owner read"
  on public.booking_events for select
  using (
    exists (
      select 1
      from public.bookings b
      join public.providers p on p.id = b.provider_id
      where b.id = booking_id and (b.customer_id = auth.uid() or p.owner_id = auth.uid())
    )
  );

create policy "payments: customer or owner read"
  on public.payments for select
  using (
    exists (
      select 1
      from public.bookings b
      join public.providers p on p.id = b.provider_id
      where b.id = booking_id and (b.customer_id = auth.uid() or p.owner_id = auth.uid())
    )
  );

create policy "reviews: public read published"
  on public.reviews for select
  using (status = 'published');

create policy "reviews: customer create own completed booking"
  on public.reviews for insert
  with check (
    author_id = auth.uid() and
    exists (
      select 1 from public.bookings b
      where b.id = booking_id and b.customer_id = auth.uid() and b.status = 'completed'
    )
  );
