-- Migration: Add payouts ledger and provider blocked dates
-- Critical gaps identified in production audit

-- 1. Payout status enum
do $$
begin
  if not exists (select 1 from pg_type where typname = 'payout_status') then
    create type public.payout_status as enum ('pending', 'processing', 'completed', 'failed', 'cancelled');
  end if;
end $$;

-- 2. Payouts table for provider revenue tracking
create table if not exists public.payouts (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete restrict,
  amount_myr integer not null check (amount_myr > 0),
  platform_fee_myr integer not null default 0 check (platform_fee_myr >= 0),
  net_amount_myr integer not null check (net_amount_myr > 0),
  status public.payout_status not null default 'pending',
  
  -- Period this payout covers
  period_start date not null,
  period_end date not null,
  
  -- Payout method details
  payout_method text not null default 'bank_transfer' check (payout_method in ('bank_transfer', 'billplz', 'manual')),
  recipient_account text, -- last 4 digits or reference
  
  -- Tracking
  reference_id text unique, -- external payout reference
  processed_at timestamptz,
  processed_by uuid references public.profiles(id),
  
  -- Metadata
  booking_count integer not null default 0,
  notes text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- Ensure period is valid
  constraint valid_period check (period_end >= period_start)
);

-- 3. Payout items junction (which bookings are included in this payout)
create table if not exists public.payout_items (
  id uuid primary key default gen_random_uuid(),
  payout_id uuid not null references public.payouts(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete restrict,
  amount_myr integer not null check (amount_myr > 0),
  platform_fee_myr integer not null default 0,
  net_amount_myr integer not null,
  created_at timestamptz not null default now(),
  
  -- Each booking can only be in one completed payout
  unique(booking_id)
);

-- 4. Provider blocked dates (vacation, unavailable)
create table if not exists public.provider_blocked_dates (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  blocked_date date not null,
  reason text, -- e.g., "Vacation", "Personal event", "Fully booked"
  is_recurring boolean not null default false, -- e.g., block every Sunday
  created_at timestamptz not null default now(),
  
  -- Prevent duplicate blocked dates
  unique(provider_id, blocked_date)
);

-- 5. Indexes for performance
create index if not exists idx_payouts_provider on public.payouts(provider_id);
create index if not exists idx_payouts_status on public.payouts(status);
create index if not exists idx_payouts_period on public.payouts(period_start, period_end);
create index if not exists idx_payout_items_payout on public.payout_items(payout_id);
create index if not exists idx_blocked_dates_provider on public.provider_blocked_dates(provider_id);
create index if not exists idx_blocked_dates_date on public.provider_blocked_dates(blocked_date);

-- 6. Enable RLS
alter table public.payouts enable row level security;
alter table public.payout_items enable row level security;
alter table public.provider_blocked_dates enable row level security;

-- 7. RLS Policies for payouts
-- Providers can read their own payouts
create policy "payouts: provider read own"
  on public.payouts for select
  using (
    exists (
      select 1 from public.providers
      where providers.id = payouts.provider_id
      and providers.owner_id = auth.uid()
    )
  );

-- Admin can do everything
create policy "payouts: admin full access"
  on public.payouts for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 8. RLS Policies for payout_items
-- Providers can read items for their payouts
create policy "payout_items: provider read own"
  on public.payout_items for select
  using (
    exists (
      select 1 from public.payouts
      join public.providers on providers.id = payouts.provider_id
      where payouts.id = payout_items.payout_id
      and providers.owner_id = auth.uid()
    )
  );

-- Admin full access
create policy "payout_items: admin full access"
  on public.payout_items for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 9. RLS Policies for blocked_dates
-- Providers can manage their own blocked dates
create policy "blocked_dates: provider manage own"
  on public.provider_blocked_dates for all
  using (
    exists (
      select 1 from public.providers
      where providers.id = provider_blocked_dates.provider_id
      and providers.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.providers
      where providers.id = provider_blocked_dates.provider_id
      and providers.owner_id = auth.uid()
    )
  );

-- Public can read blocked dates (for availability checking)
create policy "blocked_dates: public read"
  on public.provider_blocked_dates for select
  using (true);

-- 10. Function to check if date is blocked for provider
create or replace function public.is_date_blocked(
  p_provider_id uuid,
  p_date date
)
returns boolean
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  return exists (
    select 1 from public.provider_blocked_dates
    where provider_id = p_provider_id
    and blocked_date = p_date
  );
end;
$$;

-- 11. Function to get provider payout summary
create or replace function public.get_provider_payout_summary(
  p_provider_id uuid,
  p_start_date date,
  p_end_date date
)
returns table (
  total_bookings bigint,
  gross_revenue bigint,
  platform_fees bigint,
  net_payout bigint
)
language plpgsql
set search_path = public, pg_catalog
as $$
begin
  return query
  select
    count(distinct b.id) as total_bookings,
    coalesce(sum(b.total_amount_myr), 0) as gross_revenue,
    coalesce(sum(round(b.total_amount_myr * 0.10)), 0) as platform_fees, -- 10% platform fee
    coalesce(sum(b.total_amount_myr) - sum(round(b.total_amount_myr * 0.10)), 0) as net_payout
  from public.bookings b
  where b.provider_id = p_provider_id
  and b.status in ('paid_full', 'paid_deposit', 'completed')
  and b.created_at::date between p_start_date and p_end_date
  and not exists (
    -- Exclude bookings already in a completed/processing payout
    select 1 from public.payout_items pi
    join public.payouts p on p.id = pi.payout_id
    where pi.booking_id = b.id
    and p.status in ('completed', 'processing')
  );
end;
$$;

-- 12. Fix booking_surcharges RLS (add customer/provider access)
-- Only create policies if the table exists and has the right columns
do $$
begin
  -- Drop existing admin policy if exists
  drop policy if exists "booking_surcharges: admin read" on public.booking_surcharges;
  drop policy if exists "booking_surcharges: customer read own" on public.booking_surcharges;
  drop policy if exists "booking_surcharges: provider read own" on public.booking_surcharges;
  drop policy if exists "booking_surcharges: admin full access" on public.booking_surcharges;

  -- Customer can read surcharges for their bookings
  create policy "booking_surcharges: customer read own"
    on public.booking_surcharges for select
    using (
      exists (
        select 1 from public.bookings
        where bookings.id = booking_surcharges.booking_id
        and bookings.customer_id = auth.uid()
      )
    );

  -- Provider can read surcharges for their bookings (safely)
  create policy "booking_surcharges: provider read own"
    on public.booking_surcharges for select
    using (
      exists (
        select 1 from public.bookings b
        join public.providers p on p.id = b.provider_id
        where b.id = booking_surcharges.booking_id
        and p.owner_id = auth.uid()
      )
    );

  -- Admin full access
  create policy "booking_surcharges: admin full access"
    on public.booking_surcharges for all
    using (
      exists (
        select 1 from public.profiles
        where profiles.id = auth.uid()
        and profiles.role = 'admin'
      )
    );
end $$;

comment on table public.payouts is 'Provider payout records for completed booking revenue';
comment on table public.payout_items is 'Individual bookings included in each payout';
comment on table public.provider_blocked_dates is 'Dates when provider is unavailable for bookings';
