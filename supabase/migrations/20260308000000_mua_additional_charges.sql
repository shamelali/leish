-- Migration: Add MUA additional charges support
-- Based on Malaysian MUA industry standards

-- 1. Create surcharge type enum first (before using it)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'surcharge_type') then
    create type public.surcharge_type as enum ('fixed', 'percentage', 'per_km', 'per_person');
  end if;
end $$;

-- 2. Add travel fee columns to providers
alter table public.providers
  add column if not exists free_travel_radius_km integer default 0 check (free_travel_radius_km >= 0),
  add column if not exists travel_fee_per_km numeric(10,2) default 0 check (travel_fee_per_km >= 0),
  add column if not exists max_travel_distance_km integer default 100 check (max_travel_distance_km >= 0),
  add column if not exists outstation_flat_fee_myr integer default 0 check (outstation_flat_fee_myr >= 0);

-- 3. Create additional charges table for flexible surcharges
create table if not exists public.service_surcharges (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers(id) on delete cascade,
  name text not null, -- e.g., "Early Morning", "Public Holiday", "Additional Person"
  description text,
  surcharge_type public.surcharge_type not null default 'fixed',
  amount_myr integer not null check (amount_myr >= 0),
  percentage decimal(5,2) default 0 check (percentage >= 0 and percentage <= 100),
  is_active boolean not null default true,
  applies_to_days integer[] default '{}', -- 0=Sun, 1=Mon... for day-specific surcharges
  applies_before_hour integer, -- for early morning surcharges (e.g., 7 = before 7am)
  applies_after_hour integer, -- for late night surcharges
  min_advance_booking_hours integer, -- for last-minute booking fees
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Add RLS policies for service_surcharges
alter table public.service_surcharges enable row level security;

create policy "service_surcharges: public read"
  on public.service_surcharges for select
  using (true);

create policy "service_surcharges: owner mutate"
  on public.service_surcharges for all
  using (
    exists (
      select 1 from public.providers
      where providers.id = service_surcharges.provider_id
      and providers.owner_id = auth.uid()
    )
  );

-- 5. Create index for faster lookups
create index if not exists idx_service_surcharges_provider
  on public.service_surcharges(provider_id);

-- 6. Add booking_surcharges junction table for applied charges
create table if not exists public.booking_surcharges (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  surcharge_id uuid references public.service_surcharges(id) on delete set null,
  name text not null, -- snapshot of surcharge name at time of booking
  amount_myr integer not null check (amount_myr >= 0),
  reason text, -- e.g., "Travel to Subang Jaya (25km)", "Before 6am start"
  created_at timestamptz not null default now()
);

-- 7. Add RLS for booking_surcharges
alter table public.booking_surcharges enable row level security;

create policy "booking_surcharges: admin read"
  on public.booking_surcharges for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- 8. Function to calculate travel fee based on distance
create or replace function public.calculate_travel_fee(
  p_provider_id uuid,
  p_distance_km numeric
)
returns integer
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_free_radius integer;
  v_fee_per_km numeric;
  v_max_distance integer;
  v_outstation_fee integer;
  v_chargeable_distance numeric;
begin
  select 
    free_travel_radius_km,
    travel_fee_per_km,
    max_travel_distance_km,
    outstation_flat_fee_myr
  into v_free_radius, v_fee_per_km, v_max_distance, v_outstation_fee
  from public.providers
  where id = p_provider_id;
  
  -- Beyond max distance = outstation flat fee
  if v_max_distance > 0 and p_distance_km > v_max_distance then
    return v_outstation_fee;
  end if;
  
  -- Within free radius
  if p_distance_km <= v_free_radius then
    return 0;
  end if;
  
  -- Calculate chargeable distance
  v_chargeable_distance := p_distance_km - v_free_radius;
  
  -- Return calculated fee
  return ceil(v_chargeable_distance * v_fee_per_km)::integer;
end;
$$;

-- 9. Function to get applicable surcharges for a booking slot
create or replace function public.get_applicable_surcharges(
  p_provider_id uuid,
  p_slot_start timestamptz,
  p_booking_created_at timestamptz default now()
)
returns table (
  surcharge_id uuid,
  name text,
  description text,
  amount_myr integer,
  reason text
)
language plpgsql
set search_path = public, pg_catalog
as $$
declare
  v_slot_hour integer;
  v_slot_dow integer;
  v_advance_hours integer;
begin
  v_slot_hour := extract(hour from p_slot_start);
  v_slot_dow := extract(dow from p_slot_start);
  v_advance_hours := extract(epoch from (p_slot_start - p_booking_created_at)) / 3600;
  
  return query
  select 
    ss.id,
    ss.name,
    ss.description,
    case 
      when ss.surcharge_type = 'fixed' then ss.amount_myr
      when ss.surcharge_type = 'percentage' then 0 -- calculated at booking time based on service price
      else ss.amount_myr
    end as amount_myr,
    case
      when ss.applies_before_hour is not null and v_slot_hour < ss.applies_before_hour 
        then 'Early morning slot (before ' || ss.applies_before_hour || ':00)'
      when ss.applies_after_hour is not null and v_slot_hour > ss.applies_after_hour 
        then 'Late night slot (after ' || ss.applies_after_hour || ':00)'
      when ss.min_advance_booking_hours is not null and v_advance_hours < ss.min_advance_booking_hours 
        then 'Last-minute booking (within ' || ss.min_advance_booking_hours || ' hours)'
      when array_length(ss.applies_to_days, 1) > 0 and v_slot_dow = any(ss.applies_to_days)
        then 'Weekend/public holiday surcharge'
      else ss.description
    end as reason
  from public.service_surcharges ss
  where ss.provider_id = p_provider_id
    and ss.is_active = true
    and (
      -- Early morning surcharge
      (ss.applies_before_hour is not null and v_slot_hour < ss.applies_before_hour)
      or
      -- Late night surcharge
      (ss.applies_after_hour is not null and v_slot_hour > ss.applies_after_hour)
      or
      -- Last-minute booking
      (ss.min_advance_booking_hours is not null and v_advance_hours < ss.min_advance_booking_hours)
      or
      -- Specific days (weekends/holidays)
      (array_length(ss.applies_to_days, 1) > 0 and v_slot_dow = any(ss.applies_to_days))
      or
      -- Always applies if no conditions set
      (ss.applies_before_hour is null and ss.applies_after_hour is null and 
       ss.min_advance_booking_hours is null and (ss.applies_to_days is null or array_length(ss.applies_to_days, 1) = 0))
    );
end;
$$;

-- 10. Add comments for documentation
comment on table public.service_surcharges is 'Additional charges that MUAs can configure (early morning, public holiday, etc.)';
comment on table public.booking_surcharges is 'Applied surcharges for specific bookings';
comment on column public.providers.free_travel_radius_km is 'Distance in km included free with booking';
comment on column public.providers.travel_fee_per_km is 'Fee charged per km beyond free radius';
comment on column public.providers.max_travel_distance_km is 'Maximum distance MUA will travel before charging outstation flat fee';
comment on column public.providers.outstation_flat_fee_myr is 'Flat fee for outstation bookings beyond max distance';
