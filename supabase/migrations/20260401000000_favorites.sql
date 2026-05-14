-- Favorites table for customers to save artists

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(customer_id, provider_id)
);

create index if not exists favorites_customer_idx on public.favorites(customer_id);
create index if not exists favorites_provider_idx on public.favorites(provider_id);

-- RLS for favorites
alter table public.favorites enable row level security;

create policy "Users can view their own favorites" on public.favorites
  for select using (auth.uid() = customer_id);

create policy "Users can insert their own favorites" on public.favorites
  for insert with check (auth.uid() = customer_id);

create policy "Users can delete their own favorites" on public.favorites
  for delete using (auth.uid() = customer_id);

-- Function to check if provider is favorited
create or replace function public.is_favorited(customer_id uuid, provider_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists(
    select 1 from public.favorites
    where customer_id = $1 and provider_id = $2
  );
$$;
