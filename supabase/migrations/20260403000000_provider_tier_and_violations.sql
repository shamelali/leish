-- Add provider tier for Free vs Premium plans

alter table if exists public.providers
  add column if not exists tier text not null default 'free';

-- Add constraint
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'providers_tier_check'
  ) then
    alter table public.providers
      add constraint providers_tier_check
      check (tier in ('free', 'pro'));
  end if;
end
$$;

-- Add premium features tracking columns
alter table if exists public.providers
  add column if not exists tier_started_at timestamptz,
  add column if not exists tier_expires_at timestamptz,
  add column if not exists stripe_customer_id text,
  add column if not exists subscription_id text;

-- Add communication violation tracking
alter table if exists public.providers
  add column if not exists communication_violations integer not null default 0,
  add column if not exists is_suspended boolean not null default false,
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz;

-- Add client limit for free tier
alter table if exists public.providers
  add column if not exists client_limit integer not null default 10;

-- Index for tier queries
create index if not exists providers_tier_idx on public.providers(tier) where tier = 'pro';
create index if not exists providers_owner_tier_idx on public.providers(owner_id, tier);