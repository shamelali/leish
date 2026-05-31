-- Fix bookings table schema to match codebase expectations
-- The table was created with old column names (pro_id, subtotal_sen, deposit_sen, scheduled_at)
-- but the code uses provider_id, service_id, slot_id, total_amount_myr, paid_amount_myr
-- No existing data, so safe to alter.

-- Make schema changes idempotent: the linked remote already has the final schema.

-- Rename pro_id -> provider_id only if pro_id still exists
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='pro_id') then
    alter table public.bookings rename column pro_id to provider_id;
  end if;
end $$;

-- Add FK constraint if it doesn't exist
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_provider_id_fkey') then
    alter table public.bookings add constraint bookings_provider_id_fkey
      foreign key (provider_id) references public.providers(id) on delete restrict;
  end if;
end $$;

-- Add columns only if missing
do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='service_id') then
    alter table public.bookings add column service_id uuid references public.services(id) on delete restrict;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='slot_id') then
    alter table public.bookings add column slot_id uuid references public.availability_slots(id) on delete restrict;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='total_amount_myr') then
    alter table public.bookings add column total_amount_myr numeric not null default 0 check (total_amount_myr >= 0);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='paid_amount_myr') then
    alter table public.bookings add column paid_amount_myr numeric not null default 0 check (paid_amount_myr >= 0);
  end if;
end $$;

-- Drop view that depends on old column names
drop view if exists public.bookings_with_services;

-- scheduled_at is not null with no default but RPC doesn't insert it — make nullable
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='scheduled_at' and is_nullable = 'NO') then
    alter table public.bookings alter column scheduled_at drop not null;
  end if;
end $$;

-- Drop old unused columns
do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='subtotal_sen') then
    alter table public.bookings drop column subtotal_sen;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='deposit_sen') then
    alter table public.bookings drop column deposit_sen;
  end if;
end $$;

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema='public' and table_name='bookings' and column_name='currency') then
    alter table public.bookings drop column currency;
  end if;
end $$;

-- Indexes for new columns
create index if not exists idx_bookings_provider_id on public.bookings(provider_id);
create index if not exists idx_bookings_service_id on public.bookings(service_id);
create index if not exists idx_bookings_slot_id on public.bookings(slot_id);

-- Recreate the view with updated column names
create or replace view public.bookings_with_services with (security_invoker = true) as
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
