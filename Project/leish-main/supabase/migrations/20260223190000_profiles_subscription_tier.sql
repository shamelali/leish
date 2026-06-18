-- Add a stable subscription tier field for product routing (MUA vs Pro).

alter table if exists public.profiles
  add column if not exists subscription_tier text not null default 'free';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_subscription_tier_check'
  ) then
    alter table public.profiles
      add constraint profiles_subscription_tier_check
      check (subscription_tier in ('free', 'pro'));
  end if;
end
$$;
