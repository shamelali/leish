-- Studios Marketplace v1 - Add missing provider fields for studio listing

-- Add missing columns to providers table
alter table public.providers add column if not exists hourly_rate integer;
alter table public.providers add column if not exists specialties text[];
alter table public.providers add column if not exists rating integer default 0;
alter table public.providers add column if not exists review_count integer default 0;
alter table public.providers add column if not exists starting_price integer;

-- Index for studio queries
create index if not exists providers_kind_active_idx on public.providers(kind, is_active);
create index if not exists providers_state_kind_idx on public.providers(kind, state);
create index if not exists providers_slug_idx on public.providers(slug);