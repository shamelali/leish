-- Add missing columns to providers for dashboard queries
alter table public.providers
  add column if not exists hourly_rate integer default 0,
  add column if not exists specialties text[] default '{}',
  add column if not exists rating numeric(3,2) default 0,
  add column if not exists review_count integer default 0;

-- Admin audit log for tracking admin actions
create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  target text not null,
  meta jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_log_actor_idx on public.admin_audit_log(actor_id);
create index if not exists admin_audit_log_action_idx on public.admin_audit_log(action);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log(created_at desc);

-- Add gateway column to payments for payment health queries
alter table public.payments
  add column if not exists gateway text default 'stripe';

-- Add flag_reason column to reviews for moderation
alter table public.reviews
  add column if not exists flag_reason text;

-- Add reviewer_id column (alias for author_id for consistency)
alter table public.reviews
  add column if not exists reviewer_id uuid references public.profiles(id) on delete set null;

-- Backfill reviewer_id from author_id if both columns exist
do $$ 
begin
  if exists (select 1 from information_schema.columns where table_name='reviews' and column_name='author_id') then
    update public.reviews set reviewer_id = author_id where reviewer_id is null and author_id is not null;
  end if;
end $$;

-- Add customer_id to payments for easier joins
alter table public.payments
  add column if not exists customer_id uuid references public.profiles(id) on delete set null,
  add column if not exists provider_id uuid references public.providers(id) on delete set null;

-- Backfill customer_id and provider_id from bookings join if columns exist
do $$
begin
  if exists (select 1 from information_schema.columns where table_name='bookings' and column_name='provider_id') then
    update public.payments p
    set 
      customer_id = b.customer_id,
      provider_id = b.provider_id
    from public.bookings b
    where b.id = p.booking_id 
      and p.customer_id is null;
  end if;
end $$;

-- Add subscription_tier to profiles for pro dashboard tier gating (optional, currently not enforced)
alter table public.profiles
  add column if not exists subscription_tier text default 'free',
  add column if not exists subscription_expires_at timestamptz;
