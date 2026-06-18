-- Add missing provider fields required by artist and studio onboarding flows

-- Artist fields
alter table public.providers
  add column if not exists bio text,
  add column if not exists experience text,
  add column if not exists is_verified boolean not null default false;

-- Studio-specific fields
alter table public.providers
  add column if not exists studio_type text,
  add column if not exists team_size text,
  add column if not exists address text,
  add column if not exists operating_hours text;

-- Index for slug lookups (already unique but ensure index exists)
create index if not exists providers_slug_idx on public.providers(slug);
create index if not exists providers_owner_idx on public.providers(owner_id);
create index if not exists providers_kind_active_idx on public.providers(kind, is_active);
