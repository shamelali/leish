-- ============================================================================
-- Studio Booking Engine (v1)
-- ----------------------------------------------------------------------------
-- Additive, idempotent migration that generalises the studio booking system
-- so it can be applied to ANY studio:
--
--   * studio_settings        -> per-studio behaviour (timezone, buffers,
--                               booking horizon, deposit, auto-confirm...)
--   * bookable_resources     -> rooms / artists / chairs / venue are all the
--                               same model (generalises studio_rooms)
--   * availability_windows   -> recurring weekly opening hours (replaces
--                               hand-created 30-min slot rows)
--   * blocked_periods        -> one-off closed times (ranges, not just dates)
--   * bookings.starts_at/ends_at/resource_id -> bookings hold real intervals
--                               instead of only a pre-materialised slot FK
--
-- Engine (single source of truth, transactional):
--   * public.get_available_slots(...)   computed availability
--   * public.book_appointment(...)      atomic, conflict-safe booking
--   * public.booking_transition(...)    lifecycle state machine
--   * public.upsert_studio_settings(...)
--   * public.studio_has_windows(...)    engine-mode detector for API fallback
--
-- Double-booking is prevented at the storage layer: the bookings_no_overlap_active
-- exclusion constraint (see below) rejects any second active booking that
-- overlaps the same provider+resource window, no matter how two requests
-- interleave. book_appointment additionally serialises via an advisory lock on
-- (provider, resource) + a re-check against computed availability so that the
-- common (non-racing) case fails fast with helpful alternatives. The previous
-- atomic RPC (create_booking_with_lock) stays for legacy slot-based flows and
-- is covered by the same constraint because it writes to the same table.
-- ============================================================================

-- ============================================================================
-- 1. studio_settings — the "any studio" configuration record
-- ============================================================================
create table if not exists public.studio_settings (
  provider_id        uuid primary key references public.providers(id) on delete cascade,
  timezone           text not null default 'Asia/Kuala_Lumpur',
  slot_interval      int  not null default 15
    check (slot_interval between 5 and 240),
  default_buffer_min int  not null default 0
    check (default_buffer_min >= 0 and default_buffer_min <= 480),
  booking_horizon_days int not null default 90
    check (booking_horizon_days between 1 and 730),
  -- 24h advance by default (matches the historical product rule)
  min_advance_minutes int not null default 1440
    check (min_advance_minutes >= 0),
  auto_confirm       boolean not null default false,
  deposit_mode       text not null default 'none'
    check (deposit_mode in ('none', 'percent', 'fixed')),
  deposit_amount     numeric(10,2) not null default 0
    check (deposit_amount >= 0),
  cancellation_policy_hours int not null default 24
    check (cancellation_policy_hours >= 0),
  allow_customer_cancel boolean not null default true,
  max_bookings_per_slot int not null default 1
    check (max_bookings_per_slot between 1 and 100),
  reminder_minutes_before int[] not null default '{1440,120}',
  -- 'studio' = the whole studio books as one unit (default, legacy-compatible)
  -- 'room'/'artist' = customers pick a specific room/artist first
  resource_selection text not null default 'studio'
    check (resource_selection in ('studio', 'room', 'artist')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_settings enable row level security;

-- Owner / admins / studio managers read & update settings
create policy "studio_settings: owner read"
  on public.studio_settings for select
  using (
    exists (
      select 1 from public.providers p
      where p.id = studio_settings.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

create policy "studio_settings: owner write"
  on public.studio_settings for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = studio_settings.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

-- Auto-create a settings row whenever a provider is created
create or replace function public.handle_new_provider_settings()
returns trigger
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  insert into public.studio_settings (provider_id)
  values (new.id)
  on conflict (provider_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_provider_new_settings on public.providers;
create trigger trg_provider_new_settings
  after insert on public.providers
  for each row execute function public.handle_new_provider_settings();

-- ============================================================================
-- 2. bookable_resources — rooms / artists / chairs / venue as one model
-- ============================================================================
create table if not exists public.bookable_resources (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  kind         text not null default 'venue'
    check (kind in ('venue', 'room', 'artist', 'staff', 'chair', 'equipment', 'other')),
  ref_id       uuid,
  name         text not null,
  capacity     int  not null default 1 check (capacity >= 1),
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (provider_id, kind, ref_id)
);

alter table public.bookable_resources enable row level security;

create policy "bookable_resources: public read"
  on public.bookable_resources for select
  using (is_active = true);

create policy "bookable_resources: manager write"
  on public.bookable_resources for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = bookable_resources.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

-- A provider has exactly one whole-studio "venue" bookable unit
create unique index if not exists bookable_resources_one_venue
  on public.bookable_resources (provider_id)
  where kind = 'venue';

create index if not exists bookable_resources_provider_idx
  on public.bookable_resources (provider_id, is_active);

-- ============================================================================
-- 3. availability_windows — recurring weekly opening hours
-- ============================================================================
create table if not exists public.availability_windows (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  resource_id  uuid references public.bookable_resources(id) on delete cascade,
  day_of_week  int  not null check (day_of_week between 0 and 6),  -- 0 = Sunday
  start_time   time not null,
  end_time     time not null check (end_time > start_time),
  is_active    boolean not null default true,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- resource_id = NULL means "applies to every bookable resource of the studio"
create unique index if not exists availability_windows_dedup
  on public.availability_windows (
    provider_id, day_of_week, start_time, end_time,
    coalesce(resource_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

create index if not exists availability_windows_provider_idx
  on public.availability_windows (provider_id, is_active);

alter table public.availability_windows enable row level security;

create policy "availability_windows: public read"
  on public.availability_windows for select
  using (is_active = true);

create policy "availability_windows: manager write"
  on public.availability_windows for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = availability_windows.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

-- ============================================================================
-- 4. blocked_periods — one-off closed periods (range-based superset of
--    provider_blocked_dates)
-- ============================================================================
create table if not exists public.blocked_periods (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  resource_id  uuid references public.bookable_resources(id) on delete cascade,
  starts_at    timestamptz not null,
  ends_at      timestamptz not null check (ends_at > starts_at),
  reason       text,
  is_active    boolean not null default true,
  created_at   timestamptz not null default now()
);

create index if not exists blocked_periods_provider_idx
  on public.blocked_periods (provider_id, is_active);

alter table public.blocked_periods enable row level security;

create policy "blocked_periods: manager read"
  on public.blocked_periods for select
  using (
    exists (
      select 1 from public.providers p
      where p.id = blocked_periods.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

create policy "blocked_periods: manager write"
  on public.blocked_periods for all
  using (
    exists (
      select 1 from public.providers p
      where p.id = blocked_periods.provider_id
        and (p.owner_id = auth.uid()
        or exists (
          select 1 from public.profiles pr
          where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
        ))
    )
    or exists (
      select 1 from public.profiles pr
      where pr.id = auth.uid() and pr.role in ('admin', 'studio_manager')
    )
  );

-- ============================================================================
-- 5. bookings — hold real intervals + a bookable resource
-- ============================================================================
do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'bookings'
                   and column_name = 'resource_id') then
    alter table public.bookings add column resource_id uuid
      references public.bookable_resources(id) on delete set null;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'bookings'
                   and column_name = 'starts_at') then
    alter table public.bookings add column starts_at timestamptz;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'bookings'
                   and column_name = 'ends_at') then
    alter table public.bookings add column ends_at timestamptz;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'bookings'
                   and column_name = 'buffer_minutes') then
    alter table public.bookings add column buffer_minutes int not null default 0;
  end if;
end $$;

do $$ begin
  if not exists (select 1 from information_schema.columns
                 where table_schema = 'public' and table_name = 'bookings'
                   and column_name = 'idempotency_key') then
    alter table public.bookings add column idempotency_key text;
  end if;
end $$;

-- Engine bookings may not have a legacy pre-materialised slot
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'bookings'
               and column_name = 'slot_id' and is_nullable = 'NO') then
    alter table public.bookings alter column slot_id drop not null;
  end if;
end $$;

-- Allow service-less bookings (e.g. hourly room/venue rental)
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_schema = 'public' and table_name = 'bookings'
               and column_name = 'service_id' and is_nullable = 'NO') then
    alter table public.bookings alter column service_id drop not null;
  end if;
end $$;

-- Retrying after a network timeout must never create a duplicate booking
create unique index if not exists bookings_idempotency_unique
  on public.bookings (customer_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists idx_bookings_resource_id on public.bookings(resource_id);
create index if not exists idx_bookings_provider_status on public.bookings(provider_id, status);
create index if not exists idx_bookings_provider_range on public.bookings(provider_id, starts_at, ends_at)
  where starts_at is not null and ends_at is not null;
create index if not exists idx_availability_slots_booked on public.availability_slots(provider_id, starts_at, ends_at)
  where is_booked = true;

-- Additional lifecycle states for the state machine
do $$ begin
  alter type public.booking_status add value if not exists 'no_show';
exception
  when duplicate_object then null;
end $$;

-- ----------------------------------------------------------------------------
-- Hard double-booking guard.
--
-- book_appointment also serialises via an advisory lock + post-lock re-check,
-- but that pattern alone is NOT race-proof: when the RPC runs as a single
-- autocommit statement, the statement snapshot is taken before the advisory
-- lock is acquired, so the re-check can still read a slot as free while a
-- concurrent booking is uncommitted. The real invariant is enforced here, at
-- the storage layer: two overlapping bookings for the same provider+resource
-- may never both be active, no matter how the calls interleave.
-- (create_booking_with_lock — the legacy slot-based RPC — is protected the
-- same way because it writes to the same table.)
-- ----------------------------------------------------------------------------
do $$ begin
  create extension if not exists btree_gist;
end $$;

-- retire newer overlapping duplicates (if any exist from before this guard)
-- so the constraint below can always be installed without data loss: keep the
-- earliest active booking, cancel the later ones.
update public.bookings b
set status = 'canceled', updated_at = now()
from public.bookings o
where b.provider_id = o.provider_id
  and b.resource_id = o.resource_id
  and b.starts_at is not null and b.ends_at is not null
  and o.starts_at is not null and o.ends_at is not null
  and b.status::text not in ('canceled', 'refunded', 'no_show')
  and o.status::text not in ('canceled', 'refunded', 'no_show')
  and o.id <> b.id
  and o.created_at < b.created_at
  and tstzrange(o.starts_at, o.ends_at + make_interval(mins => coalesce(o.buffer_minutes, 0)))
      && tstzrange(b.starts_at, b.ends_at + make_interval(mins => coalesce(b.buffer_minutes, 0)));

do $$ begin
  alter table public.bookings drop constraint if exists bookings_no_overlap_active;
  alter table public.bookings add constraint bookings_no_overlap_active
    exclude using gist (
      provider_id with =,
      resource_id with =,
      -- only "live" statuses produce a range; anything else (canceled,
      -- refunded, no_show, or future states) yields NULL and never conflicts.
      -- The CASE lists pre-existing enum values only: the constraint can be
      -- created in the same migration that ADDs the 'no_show' enum value,
      -- and Postgres forbids using a brand-new enum value in that same
      -- transaction. No text casts are used, so the expression stays IMMUTABLE.
      -- NOTE: the buffered window is NOT indexed — `timestamptz + interval`
      -- is STABLE (timezone-dependent), which index expressions forbid. The
      -- constraint pins the exact [starts_at, ends_at) occupancy; the buffer
      -- margin stays enforced by the advisory-lock re-check + availability.
      (case
         when status in ('pending', 'payment_required', 'confirmed', 'paid_deposit', 'paid_full')
              and starts_at is not null and ends_at is not null and resource_id is not null
         then tstzrange(starts_at, ends_at)
       end) with &&
    );
end $$;

-- ============================================================================
-- 6. Engine functions
-- ============================================================================

-- 6.1 Resolve (or default) settings for a provider
create or replace function public.get_studio_settings_json(p_provider_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_row public.studio_settings%rowtype;
begin
  select * into v_row from public.studio_settings where provider_id = p_provider_id;
  if not found then
    return null;
  end if;
  return to_jsonb(v_row);
end;
$$;

-- 6.2 Idempotent settings upsert (NULL param = "keep current value")
create or replace function public.upsert_studio_settings(
  p_provider_id uuid,
  p_timezone text default null,
  p_slot_interval int default null,
  p_default_buffer_min int default null,
  p_booking_horizon_days int default null,
  p_min_advance_minutes int default null,
  p_auto_confirm boolean default null,
  p_deposit_mode text default null,
  p_deposit_amount numeric default null,
  p_cancellation_policy_hours int default null,
  p_allow_customer_cancel boolean default null,
  p_max_bookings_per_slot int default null,
  p_reminder_minutes_before int[] default null,
  p_resource_selection text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
begin
  if not exists (select 1 from public.providers where id = p_provider_id) then
    raise exception 'Provider not found';
  end if;

  insert into public.studio_settings (provider_id) values (p_provider_id)
  on conflict (provider_id) do nothing;

  update public.studio_settings set
    timezone                  = coalesce(p_timezone, timezone),
    slot_interval             = coalesce(p_slot_interval, slot_interval),
    default_buffer_min        = coalesce(p_default_buffer_min, default_buffer_min),
    booking_horizon_days      = coalesce(p_booking_horizon_days, booking_horizon_days),
    min_advance_minutes       = coalesce(p_min_advance_minutes, min_advance_minutes),
    auto_confirm              = coalesce(p_auto_confirm, auto_confirm),
    deposit_mode              = coalesce(p_deposit_mode, deposit_mode),
    deposit_amount            = coalesce(p_deposit_amount, deposit_amount),
    cancellation_policy_hours = coalesce(p_cancellation_policy_hours, cancellation_policy_hours),
    allow_customer_cancel     = coalesce(p_allow_customer_cancel, allow_customer_cancel),
    max_bookings_per_slot     = coalesce(p_max_bookings_per_slot, max_bookings_per_slot),
    reminder_minutes_before   = coalesce(p_reminder_minutes_before, reminder_minutes_before),
    resource_selection        = coalesce(p_resource_selection, resource_selection),
    updated_at = now()
  where provider_id = p_provider_id;

  return public.get_studio_settings_json(p_provider_id);
end;
$$;

-- 6.3 Engine-mode detector: does this studio run on windows?
create or replace function public.studio_has_windows(p_provider_id uuid)
returns boolean
language sql
security definer
set search_path = public, pg_catalog
as $$
  select exists (
    select 1 from public.availability_windows
    where provider_id = p_provider_id and is_active
  );
$$;

-- 6.4 Computed availability
-- Returns every open start (and end) for the given provider/service/resource.
--
-- Rules applied (all from studio_settings unless overridden by args):
--   weekly windows  x  day_of_week(p_date)   -> candidate times on the grid
--   - service duration / buffer
--   - min advance notice, booking horizon
--   - no overlap with existing active engine bookings (buffered)
--   - no overlap with blocked periods
--   - no overlap with legacy pre-booked availability slots
create or replace function public.get_available_slots(
  p_provider_id uuid,
  p_service_id uuid default null,
  p_resource_id uuid default null,
  p_date date default null,
  p_timezone text default null,
  p_duration_minutes int default null,
  p_price_myr int default null
)
returns table (
  resource_id       uuid,
  resource_name     text,
  resource_kind     text,
  start_ts          timestamptz,
  end_ts            timestamptz,
  duration_minutes  int,
  price_myr         int
)
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_settings public.studio_settings%rowtype;
  v_tz        text;
  v_date      date;
  v_dow       int;
  v_duration  int;
  v_price     int;
  v_grid      int;
  v_buffer    int;
  v_horizon   int;
  v_advance   int;
  v_service   record;
  v_res       record;
  v_win       record;
  v_step      interval;
  v_dur       interval;
  v_buf       interval;
  v_legacy_block boolean := false;
  v_win_start timestamp;      -- local wall-clock candidate range
  v_win_end   timestamp;
  v_off       int;
  v_cand      record;
  v_cand_ts   timestamptz;
  v_cand_end_ts timestamptz;
begin
  -- settings / timezone / date resolution --------------------------------
  select * into v_settings
  from public.studio_settings where provider_id = p_provider_id;
  if not found then
    v_settings := null;
  end if;

  v_tz  := coalesce(nullif(p_timezone, ''), v_settings.timezone, 'Asia/Kuala_Lumpur');
  v_date := coalesce(p_date, (now() at time zone v_tz)::date);
  v_dow := extract(dow from v_date)::int;
  v_grid    := coalesce(v_settings.slot_interval, 15);
  v_buffer  := coalesce(v_settings.default_buffer_min, 0);
  v_horizon := coalesce(v_settings.booking_horizon_days, 90);
  v_advance := coalesce(v_settings.min_advance_minutes, 0);

  -- service / duration / price resolution --------------------------------
  v_duration := p_duration_minutes;
  v_price    := p_price_myr;
  if p_service_id is not null then
    select s.duration_minutes, s.price_myr into v_service
    from public.services s
    where s.id = p_service_id and s.provider_id = p_provider_id and s.is_active;
    if not found then
      raise exception 'Service not found or inactive for this provider';
    end if;
    v_duration := v_service.duration_minutes;
    v_price    := v_service.price_myr;
  end if;
  if v_duration is null or v_duration <= 0 then
    raise exception 'A positive duration is required (pass a service or p_duration_minutes)';
  end if;
  v_price := coalesce(v_price, 0);

  -- any future legacy pre-booked slot blocks the whole provider (transitional)
  v_legacy_block := exists (
    select 1 from public.availability_slots ls
    where ls.provider_id = p_provider_id and ls.is_booked
      and ls.ends_at > now()
  );

  v_step := make_interval(mins => v_grid);
  v_dur  := make_interval(mins => v_duration);
  v_buf  := make_interval(mins => v_buffer);

  -- resources to iterate ------------------------------------------------
  -- explicit resource id / default whole-studio venue / every active resource
  for v_res in
    select r.id, r.name, r.kind
    from public.bookable_resources r
    where r.provider_id = p_provider_id
      and r.is_active
      and (
        p_resource_id is not null and r.id = p_resource_id
        or p_resource_id is null
           and coalesce(v_settings.resource_selection, 'studio') = 'studio'
           and r.kind = 'venue'
        or p_resource_id is null
           and coalesce(v_settings.resource_selection, 'studio') <> 'studio'
      )
    order by r.sort_order, r.kind, r.name
  loop
    -- windows that apply to this resource (resource-specific or provider-wide)
    for v_win in
      select w.id, w.day_of_week, w.start_time, w.end_time
      from public.availability_windows w
      where w.provider_id = p_provider_id
        and w.is_active
        and w.day_of_week = v_dow
        and (w.resource_id is null or w.resource_id = v_res.id)
      order by w.start_time
    loop
      -- local window on the requested date
      v_win_start := v_date + v_win.start_time;
      v_win_end   := v_date + v_win.end_time;

      -- align first candidate to the slot grid
      v_off := (v_grid - (extract(minute from v_win_start)::int % v_grid)) % v_grid;
      v_win_start := v_win_start + make_interval(mins => v_off);

      if v_win_start + v_dur > v_win_end then
        continue; -- window too short for this service
      end if;

      for v_cand in
        select gs as t
        from generate_series(v_win_start, v_win_end - v_dur, v_step) gs
      loop
        v_cand_ts := v_cand.t at time zone v_tz;
        v_cand_end_ts := v_cand_ts + v_dur;

        -- min advance notice
        if v_cand_ts < now() + make_interval(mins => v_advance) then
          continue;
        end if;

        -- booking horizon
        if v_cand_end_ts > now() + make_interval(days => v_horizon) then
          continue;
        end if;

        -- not conflicting with an existing active engine booking (buffered)
        if exists (
          select 1 from public.bookings b
          where b.provider_id = p_provider_id
            and b.status in ('pending', 'payment_required', 'confirmed', 'paid_deposit', 'paid_full')
            and b.starts_at is not null and b.ends_at is not null
            and (b.resource_id = v_res.id or b.resource_id is null)
            and v_cand_ts < b.ends_at + make_interval(mins => coalesce(b.buffer_minutes, 0))
            and v_cand_end_ts > b.starts_at
        ) then
          continue;
        end if;

        -- not blocked (provider-wide or resource-specific)
        if exists (
          select 1 from public.blocked_periods bp
          where bp.provider_id = p_provider_id
            and bp.is_active
            and (bp.resource_id is null or bp.resource_id = v_res.id)
            and v_cand_ts < bp.ends_at and v_cand_end_ts > bp.starts_at
        ) then
          continue;
        end if;

        -- not overlapping a legacy pre-booked slot (transitional provider-wide)
        if v_legacy_block and exists (
          select 1 from public.availability_slots ls
          where ls.provider_id = p_provider_id and ls.is_booked
            and v_cand_ts < ls.ends_at and v_cand_end_ts > ls.starts_at
        ) then
          continue;
        end if;

        resource_id      := v_res.id;
        resource_name    := v_res.name;
        resource_kind    := v_res.kind;
        start_ts         := v_cand_ts;
        end_ts           := v_cand_end_ts;
        duration_minutes := v_duration;
        price_myr        := v_price;
        return next;
      end loop;
    end loop;
  end loop;

  return;
end;
$$;

-- 6.5 Atomic booking
create or replace function public.book_appointment(
  p_customer_id uuid,
  p_provider_id uuid,
  p_service_id uuid default null,
  p_resource_id uuid default null,
  p_start_ts timestamptz default null,
  p_timezone text default null,
  p_duration_minutes int default null,
  p_price_myr int default null,
  p_notes text default null,
  p_idempotency_key text default null,
  p_status text default 'pending'
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_settings public.studio_settings%rowtype;
  v_tz text;
  v_service record;
  v_duration int;
  v_price int;
  v_resource uuid;
  v_found boolean := false;
  v_booking_id uuid;
  v_total int;
  v_deposit numeric;
  v_status public.booking_status;
  v_alt jsonb;
  v_lock_key text;
begin
  if p_customer_id is null or p_provider_id is null or p_start_ts is null then
    raise exception 'customer_id, provider_id and start time are required';
  end if;

  if not exists (select 1 from public.providers where id = p_provider_id and is_active) then
    raise exception 'Provider not found or inactive';
  end if;

  select * into v_settings from public.studio_settings where provider_id = p_provider_id;
  if not found then v_settings := null; end if;

  v_tz := coalesce(nullif(p_timezone, ''), v_settings.timezone, 'Asia/Kuala_Lumpur');
  v_resource := p_resource_id;

  -- resolve the default whole-studio resource when none requested
  if v_resource is null then
    select r.id into v_resource
    from public.bookable_resources r
    where r.provider_id = p_provider_id and r.kind = 'venue' and r.is_active
    order by r.sort_order, r.id
    limit 1;
    if v_resource is null then
      raise exception 'Studio has no default bookable resource configured';
    end if;
  end if;

  -- duration & price from service (or explicit params)
  v_duration := p_duration_minutes;
  v_price    := p_price_myr;
  if p_service_id is not null then
    select s.duration_minutes, s.price_myr into v_service
    from public.services s
    where s.id = p_service_id and s.provider_id = p_provider_id and s.is_active;
    if not found then raise exception 'Service not found or inactive for this provider'; end if;
    v_duration := v_service.duration_minutes;
    v_price    := v_service.price_myr;
  end if;
  if v_duration is null or v_duration <= 0 then
    raise exception 'A positive duration is required';
  end if;
  v_total := coalesce(v_price, 0);

  -- serialise per (provider, resource) so check + insert are atomic
  v_lock_key := 'leish_book:' || p_provider_id::text || ':' || v_resource::text;
  perform pg_advisory_xact_lock(hashtextextended(v_lock_key, 0));

  -- idempotent retry (network-safe): checked AFTER the lock so two identical
  -- in-flight requests cannot both pass the pre-check
  if p_idempotency_key is not null then
    select id into v_booking_id
    from public.bookings
    where customer_id = p_customer_id and idempotency_key = p_idempotency_key
    limit 1;
    if v_booking_id is not null then
      return jsonb_build_object(
        'ok', true, 'duplicate', true,
        'booking_id', v_booking_id
      );
    end if;
  end if;

  -- re-verify after acquiring the lock: the slot must still be offerable
  select 1 into v_found
  from public.get_available_slots(
    p_provider_id,
    p_service_id,
    v_resource,
    (p_start_ts at time zone v_tz)::date,
    v_tz,
    v_duration,
    v_price
  ) g
  where g.start_ts = p_start_ts
  limit 1;

  if not v_found then
    select jsonb_agg(
      jsonb_build_object(
        'resource_id', g.resource_id, 'start_ts', g.start_ts, 'end_ts', g.end_ts
      ) order by g.start_ts
    )
    into v_alt
    from (
      select g2.resource_id, g2.start_ts, g2.end_ts
      from public.get_available_slots(
        p_provider_id, p_service_id, v_resource,
        (p_start_ts at time zone v_tz)::date, v_tz, v_duration, v_price
      ) g2
      where g2.start_ts > p_start_ts
      order by g2.start_ts
      limit 3
    ) g;

    return jsonb_build_object(
      'ok', false,
      'error', 'Time slot is no longer available',
      'conflict', true,
      'alternatives', coalesce(v_alt, '[]'::jsonb)
    );
  end if;

  if p_status not in ('pending', 'payment_required') then
    raise exception 'Initial booking status must be pending or payment_required';
  end if;
  v_status := p_status::public.booking_status;

  if not exists (select 1 from public.profiles where id = p_customer_id) then
    raise exception 'Customer profile not found';
  end if;

  begin
    insert into public.bookings (
      customer_id, provider_id, service_id, resource_id,
      slot_id, starts_at, ends_at, buffer_minutes,
      status, notes, total_amount_myr, paid_amount_myr, idempotency_key
    ) values (
      p_customer_id, p_provider_id, p_service_id, v_resource,
      null, p_start_ts, p_start_ts + make_interval(mins => v_duration),
      coalesce(v_settings.default_buffer_min, 0),
      v_status, p_notes, v_total, 0, p_idempotency_key
    )
    returning id into v_booking_id;
  exception
    when unique_violation then
      -- a same-key request for a different provider slipped in first
      select id into v_booking_id
      from public.bookings
      where customer_id = p_customer_id and idempotency_key = p_idempotency_key
      limit 1;
      if v_booking_id is null then raise; end if;
      return jsonb_build_object(
        'ok', true, 'duplicate', true,
        'booking_id', v_booking_id
      );
    when exclusion_violation then
      -- lost the race to a concurrent booking on the same provider+resource
      -- (advisory-lock re-check ran on a pre-lock snapshot; the storage-layer
      --  bookings_no_overlap_active constraint is the authoritative guard)
      if p_idempotency_key is not null then
        select id into v_booking_id
        from public.bookings
        where customer_id = p_customer_id and idempotency_key = p_idempotency_key
        limit 1;
        if v_booking_id is not null then
          return jsonb_build_object(
            'ok', true, 'duplicate', true,
            'booking_id', v_booking_id
          );
        end if;
      end if;
      return jsonb_build_object(
        'ok', false,
        'error', 'Time slot is no longer available',
        'conflict', true,
        'alternatives', '[]'::jsonb
      );
  end;

  insert into public.booking_events (booking_id, event_type, event_payload, created_by)
  values (
    v_booking_id, 'booking_created',
    jsonb_build_object(
      'providerId', p_provider_id,
      'serviceId', p_service_id,
      'resourceId', v_resource,
      'startTs', p_start_ts,
      'endTs', p_start_ts + make_interval(mins => v_duration),
      'totalAmountMyr', v_total,
      'idempotencyKey', p_idempotency_key
    ),
    p_customer_id
  );

  -- deposit guidance for the payment step (payment itself is out of engine scope)
  if coalesce(v_settings.deposit_mode, 'none') = 'percent' then
    v_deposit := ceil(v_total * coalesce(v_settings.deposit_amount, 0) / 100.0);
  elsif coalesce(v_settings.deposit_mode, 'none') = 'fixed' then
    v_deposit := least(ceil(coalesce(v_settings.deposit_amount, 0)), v_total);
  else
    v_deposit := 0;
  end if;

  return jsonb_build_object(
    'ok', true,
    'booking_id', v_booking_id,
    'total_amount_myr', v_total,
    'deposit_mode', coalesce(v_settings.deposit_mode, 'none'),
    'deposit_amount_myr', v_deposit::int
  );
end;
$$;

-- 6.6 Lifecycle state machine
create or replace function public.booking_transition(
  p_booking_id uuid,
  p_event text,
  p_actor_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  v_b public.bookings%rowtype;
  v_role text;
  v_is_admin boolean := false;
  v_is_owner boolean := false;
  v_is_customer boolean := false;
  v_next public.booking_status;
  v_booking_start timestamptz;
  v_policy_hours int;
  v_new_start timestamptz;
  v_new_resource uuid;
  v_new_dur interval;
  v_found boolean;
  v_settings public.studio_settings%rowtype;
  v_tz text;
  v_slot_free boolean := false;
begin
  if p_booking_id is null then raise exception 'booking_id is required'; end if;
  if p_event not in ('confirm', 'cancel', 'complete', 'no_show', 'refund', 'reschedule') then
    raise exception 'Unknown event: %', p_event;
  end if;

  select * into v_b from public.bookings where id = p_booking_id for update;
  if not found then raise exception 'Booking not found'; end if;

  -- authorization ---------------------------------------------------------
  if p_actor_id is not null then
    select role into v_role from public.profiles where id = p_actor_id;
    v_is_admin    := v_role = 'admin';
    v_is_owner    := exists (
      select 1 from public.providers p
      where p.id = v_b.provider_id and p.owner_id = p_actor_id
    );
    v_is_customer := v_b.customer_id = p_actor_id;

    -- customers may only cancel; studio owners/admins may do everything
    if not (v_is_admin or v_is_owner) then
      if v_is_customer and p_event = 'cancel' then
        null; -- allowed (policy checked below)
      else
        raise exception 'Not authorized for event %', p_event;
      end if;
    end if;
  end if;

  -- idempotent no-op: the requested state is already reached
  if (p_event = 'confirm' and v_b.status = 'confirmed')
     or (p_event = 'cancel' and v_b.status = 'canceled')
     or (p_event = 'complete' and v_b.status = 'completed')
     or (p_event = 'no_show' and v_b.status = 'no_show')
     or (p_event = 'refund' and v_b.status = 'refunded') then
    return jsonb_build_object(
      'ok', true, 'booking_id', p_booking_id, 'status', v_b.status, 'noop', true
    );
  end if;

  -- terminal states cannot change ------------------------------------------
  if v_b.status in ('canceled', 'completed', 'refunded', 'no_show') then
    raise exception 'Cannot % a booking in terminal state %', p_event, v_b.status;
  end if;

  -- the effective appointment window (engine interval or legacy slot row)
  v_booking_start := v_b.starts_at;
  if v_booking_start is null and v_b.slot_id is not null then
    select starts_at into v_booking_start
    from public.availability_slots where id = v_b.slot_id;
  end if;

  -- resolve destination state ----------------------------------------------
  case p_event
    when 'confirm' then
      if v_b.status not in ('pending', 'payment_required') then
        raise exception 'Only pending/payment_required bookings can be confirmed (current: %)', v_b.status;
      end if;
      v_next := 'confirmed';
    when 'complete' then
      if v_b.status not in ('confirmed', 'paid_deposit', 'paid_full') then
        raise exception 'Only confirmed/paid bookings can be completed (current: %)', v_b.status;
      end if;
      v_next := 'completed';
    when 'no_show' then
      if v_b.status not in ('confirmed', 'paid_deposit', 'paid_full') then
        raise exception 'Only confirmed/paid bookings can be marked no-show (current: %)', v_b.status;
      end if;
      v_next := 'no_show';
      v_slot_free := true;
    when 'refund' then
      if v_b.status not in ('paid_deposit', 'paid_full', 'confirmed') then
        raise exception 'Only paid bookings can be refunded (current: %)', v_b.status;
      end if;
      v_next := 'refunded';
      v_slot_free := true;
    when 'cancel' then
      v_next := 'canceled';
      v_slot_free := true;

      -- customer cancellation policy (owners/admins bypass)
      if v_is_customer and not (v_is_admin or v_is_owner) then
        select cancellation_policy_hours into v_policy_hours
        from public.studio_settings where provider_id = v_b.provider_id;
        v_policy_hours := coalesce(v_policy_hours, 24);

        if v_booking_start is not null
           and now() > v_booking_start - make_interval(hours => v_policy_hours) then
          raise exception 'Cancellation window has passed (free cancellation up to %h before start)', v_policy_hours;
        end if;
      end if;
    when 'reschedule' then
      if v_b.status not in ('pending', 'payment_required', 'confirmed', 'paid_deposit', 'paid_full') then
        raise exception 'Booking cannot be rescheduled from state %', v_b.status;
      end if;

      v_new_start := (p_payload ->> 'newStartTs')::timestamptz;
      if v_new_start is null then raise exception 'reschedule requires payload.newStartTs'; end if;
      v_new_resource := (p_payload ->> 'resourceId')::uuid;

      select * into v_settings from public.studio_settings where provider_id = v_b.provider_id;
      if not found then v_settings := null; end if;
      v_tz := coalesce(v_settings.timezone, 'Asia/Kuala_Lumpur');

      -- recompute interval (service duration preferred, fall back to old range)
      v_new_dur := make_interval(mins => coalesce(
        (select duration_minutes from public.services where id = v_b.service_id),
        (select extract(epoch from (v_b.ends_at - v_b.starts_at)) / 60),
        30
      )::int);

      if v_new_resource is null then v_new_resource := v_b.resource_id; end if;
      if v_new_resource is null then
        select id into v_new_resource from public.bookable_resources
        where provider_id = v_b.provider_id and kind = 'venue' and is_active limit 1;
      end if;

      perform pg_advisory_xact_lock(hashtextextended(
        'leish_book:' || v_b.provider_id::text || ':' || v_new_resource::text, 0));

      select 1 into v_found
      from public.get_available_slots(
        v_b.provider_id, v_b.service_id, v_new_resource,
        (v_new_start at time zone v_tz)::date, v_tz
      ) g
      where g.start_ts = v_new_start
      limit 1;

      if not v_found then raise exception 'Requested time is not available'; end if;

      v_next := v_b.status; -- rescheduling preserves the lifecycle state
      v_slot_free := true;
  end case;

  -- apply -------------------------------------------------------------------
  begin
    update public.bookings
    set status = v_next,
        updated_at = now(),
        starts_at = case when p_event = 'reschedule' then v_new_start else starts_at end,
        ends_at   = case when p_event = 'reschedule' then v_new_start + v_new_dur else ends_at end,
        resource_id = case when p_event = 'reschedule' then v_new_resource else resource_id end,
        slot_id     = case when p_event = 'reschedule' then null else slot_id end
    where id = p_booking_id;
  exception
    when exclusion_violation then
      -- another booking claimed the target window between our check and update
      raise exception 'Requested time is not available';
  end;

  -- free a legacy pre-materialised slot when the time is released
  if v_slot_free and v_b.slot_id is not null then
    update public.availability_slots set is_booked = false where id = v_b.slot_id;
  end if;

  insert into public.booking_events (booking_id, event_type, event_payload, created_by)
  values (
    p_booking_id, p_event,
    p_payload || jsonb_build_object(
      'fromStatus', v_b.status,
      'toStatus', v_next,
      'bookingStart', v_booking_start
    ),
    p_actor_id
  );

  return jsonb_build_object(
    'ok', true,
    'booking_id', p_booking_id,
    'status', v_next
  );
end;
$$;

-- ============================================================================
-- 7. Seeds (existing data becomes engine-ready without any data loss)
-- ============================================================================
-- settings row for every existing provider
insert into public.studio_settings (provider_id)
select id from public.providers
on conflict (provider_id) do nothing;

-- whole-studio bookable unit for every existing provider
insert into public.bookable_resources (provider_id, kind, name)
select p.id, 'venue', p.display_name || ' (whole studio)'
from public.providers p
where not exists (
  select 1 from public.bookable_resources r
  where r.provider_id = p.id and r.kind = 'venue'
);

-- promote existing studio rooms to bookable resources (no data loss)
insert into public.bookable_resources (provider_id, kind, ref_id, name, capacity)
select sr.studio_id, 'room', sr.id, sr.name, 1
from public.studio_rooms sr
where sr.is_active
on conflict (provider_id, kind, ref_id) do nothing;

-- ============================================================================
-- 8. Grants
-- ============================================================================
revoke all on function public.get_available_slots(uuid, uuid, uuid, date, text, int, int) from public;
grant execute on function public.get_available_slots(uuid, uuid, uuid, date, text, int, int)
  to anon, authenticated, service_role;

revoke all on function public.get_studio_settings_json(uuid) from public;
grant execute on function public.get_studio_settings_json(uuid) to anon, authenticated, service_role;

revoke all on function public.studio_has_windows(uuid) from public;
grant execute on function public.studio_has_windows(uuid) to anon, authenticated, service_role;

revoke all on function public.upsert_studio_settings(uuid, text, int, int, int, int, boolean, text, numeric, int, boolean, int, int[], text) from public;
grant execute on function public.upsert_studio_settings(uuid, text, int, int, int, int, boolean, text, numeric, int, boolean, int, int[], text)
  to authenticated, service_role;

revoke all on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, int, int, text, text, text) from public;
grant execute on function public.book_appointment(uuid, uuid, uuid, uuid, timestamptz, text, int, int, text, text, text)
  to authenticated, service_role;

revoke all on function public.booking_transition(uuid, text, uuid, jsonb) from public;
grant execute on function public.booking_transition(uuid, text, uuid, jsonb)
  to authenticated, service_role;
