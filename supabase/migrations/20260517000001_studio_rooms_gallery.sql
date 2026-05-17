-- Studio Rooms (spaces that can be booked inside a studio)
create table if not exists public.studio_rooms (
  id           uuid primary key default gen_random_uuid(),
  studio_id    uuid not null references public.providers(id) on delete cascade,
  name         text not null,
  description  text,
  capacity     text,          -- e.g. "1–5 people"
  price_per_hour numeric(10,2) not null default 0,
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

alter table public.studio_rooms enable row level security;

-- Anyone can read active rooms
create policy "studio_rooms: public read"
  on public.studio_rooms for select
  using (is_active = true);

-- Studio manager / admin can manage
create policy "studio_rooms: manager write"
  on public.studio_rooms for all
  using (
    exists (
      select 1 from public.providers p
      join public.profiles pr on pr.id = auth.uid()
      where p.id = studio_id
        and pr.role in ('admin', 'studio_manager')
    )
  );

-- Studio Gallery Images (per studio, per room slot)
create table if not exists public.studio_gallery (
  id          uuid primary key default gen_random_uuid(),
  studio_id   uuid not null references public.providers(id) on delete cascade,
  room_id     uuid references public.studio_rooms(id) on delete set null,
  image_url   text not null,
  media_type  text not null default 'image' check (media_type in ('image', 'video')),
  caption     text,
  slot        int,            -- ordered position in gallery
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.studio_gallery enable row level security;

create policy "studio_gallery: public read"
  on public.studio_gallery for select
  using (is_active = true);

create policy "studio_gallery: manager write"
  on public.studio_gallery for all
  using (
    exists (
      select 1 from public.providers p
      join public.profiles pr on pr.id = auth.uid()
      where p.id = studio_id
        and pr.role in ('admin', 'studio_manager')
    )
  );

-- Extend reviews table with room_id (nullable — can be per-studio or per-room)
alter table public.reviews
  add column if not exists room_id uuid references public.studio_rooms(id) on delete set null;

-- Index for fast room gallery lookups
create index if not exists idx_studio_gallery_studio_id on public.studio_gallery(studio_id);
create index if not exists idx_studio_rooms_studio_id   on public.studio_rooms(studio_id);
create index if not exists idx_reviews_room_id           on public.reviews(room_id);
