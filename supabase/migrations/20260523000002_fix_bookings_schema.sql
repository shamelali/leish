-- Fix bookings table schema to match codebase expectations
-- The table was created with old column names (pro_id, subtotal_sen, deposit_sen, scheduled_at)
-- but the code uses provider_id, service_id, slot_id, total_amount_myr, paid_amount_myr
-- No existing data, so safe to alter.

-- Rename pro_id -> provider_id and add FK
alter table public.bookings
  rename column pro_id to provider_id;

alter table public.bookings
  add constraint bookings_provider_id_fkey
    foreign key (provider_id) references public.providers(id) on delete restrict;

-- Add missing columns for service/slot relationships and amounts
alter table public.bookings
  add column service_id uuid references public.services(id) on delete restrict,
  add column slot_id uuid references public.availability_slots(id) on delete restrict,
  add column total_amount_myr numeric not null default 0 check (total_amount_myr >= 0),
  add column paid_amount_myr numeric not null default 0 check (paid_amount_myr >= 0);

-- Drop view that depends on old column names
drop view if exists public.bookings_with_services;

-- scheduled_at is not null with no default but RPC doesn't insert it — make nullable
alter table public.bookings
  alter column scheduled_at drop not null;

-- Drop old unused columns
alter table public.bookings
  drop column if exists subtotal_sen,
  drop column if exists deposit_sen,
  drop column if exists currency;

-- Indexes for new columns
create index if not exists idx_bookings_provider_id on public.bookings(provider_id);
create index if not exists idx_bookings_service_id on public.bookings(service_id);
create index if not exists idx_bookings_slot_id on public.bookings(slot_id);

-- Recreate the view with updated column names
create view public.bookings_with_services as
select
  b.id,
  b.customer_id,
  b.provider_id,
  b.status,
  b.notes,
  b.total_amount_myr,
  b.paid_amount_myr,
  b.created_at,
  b.updated_at,
  b.expires_at,
  b.user_id,
  b.space_id,
  b.booking_date,
  b.start_time,
  b.end_time,
  b.duration_hours,
  b.total_price,
  b.payment_status,
  b.access_code,
  b.confirmed_at,
  b.canceled_at,
  b.completed_at,
  b.refunded_at,
  s.id as service_id,
  s.name as service_name,
  s.duration_minutes,
  s.price_myr,
  s.is_active as service_is_active
from public.bookings b
  join public.services s on s.id = b.service_id;

-- Update trigger function for booking completion (uses total_amount_myr)
-- award_loyalty_points(booking_id) reads customer_id + total_amount_myr internally
create or replace function public.trigger_award_loyalty_points()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_catalog
as $$
begin
  if new.status = 'completed' and old.status != 'completed' then
    perform public.award_loyalty_points(new.id);
  end if;
  return new;
end;
$$;
