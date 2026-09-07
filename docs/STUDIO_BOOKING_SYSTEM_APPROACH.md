# Studio Booking Management System — Recommended Approach

> Scope: Leish studio booking system that can be applied to **any studio** (beauty
> salon, barbershop, nail/eyelash studio, tattoo studio, photography studio, clinic,
> co-working rooms, etc.) — i.e. one engine, configured per studio, never per-studio code.
>
> Status: Implemented for the data layer + studio APIs + dashboard schedule manager
> (see §10). Customer-facing book flow and payment step are the remaining work.

---

## 1. TL;DR — the recommendation in one paragraph

Replace the current **pre-materialized 30-minute slot rows with an `is_booked` flag**
with an **interval-based, resource-aware booking engine**:

- **Availability is computed on demand** from declarative schedule rules
  (recurring weekly opening hours + one-off blocked periods), service durations,
  buffers, and existing bookings — instead of stored as rows that must be
  generated, kept in sync, and re-generated whenever the studio changes anything.
- **Double-booking is prevented by the database**, not by the application: a
  Postgres **exclusion constraint** on `(bookable resource, time range)` guarantees
  no two confirmed bookings can overlap the same room / artist / chair / provider.
- **Services and resources are data, not code**: any service length (15 min to
  8 hours), any resource type (room, artist, chair, camera kit), any opening hours,
  booking horizon, deposit % or confirmation policy — all driven by a per-studio
  configuration record + schedule tables.
- **One transactional engine** (Postgres functions) is the single source of truth
  for "is this time open?" and "book it" — the Next.js API routes, the web app, and
  the studio dashboard all call the same engine, so invariants cannot drift between
  two code paths (today the race lives between `apps/studio/app/api/bookings/route.ts`
  and `apps/studio/app/api/availability/route.ts`).

This is the standard architecture used by modern booking platforms (Cal.com,
Fresha, Booksy, Square Appointments) and it generalizes to *any* studio type
because the model is resource + time interval, not "studio + 30-min slot".

---

## 2. Why the current approach cannot scale to "any studio"

Concrete gaps found in the current codebase:

| # | Gap | Where it lives today | Why it breaks "any studio" |
|---|-----|----------------------|----------------------------|
| 1 | **Fixed 30-minute grid** | `THIRTY_MINUTES_MS` + "Slots must be exactly 30 minutes", ":00/:30 boundary" in `apps/studio/app/api/availability/route.ts`; `handleStartsAtChange` hard-codes +30 min in `pro-availability-manager.tsx` | A 45-min facial, 2.5-h bridal session, or hour+ photoshoot can't be expressed; fixed grids force a studio to shoehorn its services into 30-min blocks |
| 2 | **Materialized slots + `is_booked` flag** | `public.availability_slots`; `is_booked` flips in routes | Rows must exist before a customer can book; schedule edits, holidays, timezone changes, new services, or un-booked gaps require regenerating/deleting rows; stale rows produce phantom availability |
| 3 | **Check-then-insert race** | `apps/studio/app/api/bookings/route.ts` reads `slot.is_booked`, inserts booking, then updates flag — two non-transactional steps | Two customers can pass the check simultaneously → **double booking**. The older `create_booking_with_lock()` RPC (`20260307140000_atomic_booking_lock.sql`) already does this correctly but isn't what the studio route uses |
| 4 | **One slot = whole provider** | `availability_slots(provider_id, starts_at, ends_at)` is unique per provider | A studio with 3 rooms/2 artists is modelled as one bookable thing. Booking room B blocks room A too; no capacity, no per-resource conflict detection |
| 5 | **Rooms are a catalog, not a resource** | `studio_rooms` has name/price/gallery but bookings never reference `room_id` | No room-level booking, no room-level availability, no room-level calendar |
| 6 | **Hard-coded business rules** | 24-hour advance notice inside `create_booking_with_lock()`; statuses mapped ad hoc in `PATCH /api/bookings` (`confirm/complete/cancel/refund`) | Rules must differ per studio (some want auto-confirm, some manual; some allow same-day, some 48 h notice; deposit 0–100%) — today that means code edits per studio |
| 7 | **No weekly schedule / recurrence** | Studio staff must create every slot row by hand in `pro-availability-manager.tsx` | Any real studio runs a repeating weekly timetable; hand-adding rows for months ahead is the #1 reason staff abandon booking tools |
| 8 | **Status handled loosely** | Direct `update({status})` calls; a "cancel" from the wrong state (e.g. after completion) is possible | Booking lifecycles need a state machine so invalid transitions are impossible |
| 9 | **No timezone model** | Slots stored as `timestamptz` but everything is entered/displayed from device-local time | A studio (or a customer) in a different timezone than the server gets wrong slots; bookings must store the studio's `Asia/Kuala_Lumpur` wall-clock intent and display in viewer-local time |
| 10 | **Two access layers** | Supabase-js (`getSupabaseSsrClient`) *and* `postgres.js` (`getSql`) both mutate bookings/slots | Business rules enforced in one layer are bypassable in the other; keep invariants in SQL, both layers just call it |

---

## 3. Design principles (the "any studio" contract)

1. **Resource + interval is the universal model.** A booking is *some duration of
   a bookable resource*. Everything else (service, price, deposit, room, artist) is
   attached data. This is what makes the engine work for any studio vertical.
2. **DB enforces truth.** No two *active* bookings may overlap the same resource
   (exclusion constraint). App-level checks are UX sugar, not guarantees.
3. **Availability is derived, never stored.** Rules (schedule + exceptions) are
   stored; open times are *computed* at read time. Nothing to go stale.
4. **Rules are per-studio configuration** (`studio_settings` + schedule tables),
   read by the engine at runtime. Onboarding a new studio = inserting config rows,
   not shipping code.
5. **One transactional engine.** All state changes (book, cancel, reschedule,
   complete, no-show, block) go through Postgres functions in a transaction; every
   mutation appends a `booking_events` audit row (table already exists).
6. **Explicit lifecycle.** Booking status is a small state machine with legal
   transitions; payment status is tracked alongside, never conflated into booking
   status.
7. **Timezone-first.** Store UTC (`timestamptz`) *plus* the studio's IANA timezone
   in settings; generate/interpret every local window in the studio timezone so a
   salon in KL and a customer in Singapore both see correct times.

---

## 4. Target data model

Evolution of the *existing* schema — new tables, plus small changes to existing
ones. (All names follow current snake_case conventions.)

### 4.1 `studio_settings` — the per-studio configuration (the "any studio" key)

```sql
create table public.studio_settings (
  provider_id        uuid primary key references public.providers(id) on delete cascade,
  timezone           text not null default 'Asia/Kuala_Lumpur',      -- IANA
  slot_interval      int  not null default 15,                       -- query granularity (min)
  default_buffer_min int  not null default 0,                        -- gap between appointments
  booking_horizon_days  int not null default 90,                     -- how far ahead customers may book
  min_advance_minutes   int not null default 0,                      -- e.g. 24h rule per studio
  auto_confirm       boolean not null default false,                 -- false = studio must confirm
  deposit_mode       text not null default 'none'                    -- none|percent|fixed
    check (deposit_mode in ('none','percent','fixed')),
  deposit_amount     numeric(10,2) not null default 0,
  cancellation_policy_hours int not null default 24,                 -- free-cancel cutoff
  allow_customer_cancel boolean not null default true,
  max_bookings_per_slot int not null default 1,                      -- >1 for classes/workshops
  reminder_minutes_before int[] not null default '{1440,120}',
  resource_selection text not null default 'studio'                  -- studio|room|artist|auto
    check (resource_selection in ('studio','room','artist','auto')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

"Applied to any studio" literally means: this row **is** the studio's behaviour.
No studio-specific branches in code — the engine reads these settings.

### 4.2 Bookable resources (generalizes `studio_rooms`)

One table that covers rooms, artists, chairs, kits — anything time-exclusive.

```sql
create table public.bookable_resources (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  kind         text not null default 'room'
    check (kind in ('room','artist','staff','chair','equipment','venue','other')),
  ref_id       uuid,                       -- optional FK to studio_rooms / profiles / studio_artists
  name         text not null,
  capacity     int  not null default 1,    -- >1 → bookable for group slots
  is_active    boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  unique (provider_id, kind, ref_id)
);
```

Seed rows for existing data: each `studio_rooms` row becomes a
`bookable_resources(kind='room', ref_id=room.id)` row; each active `studio_artists`
row becomes `kind='artist'`; every studio also gets a default
`kind='venue'` row so single-occupancy "the whole studio" booking keeps working
(`resource_selection='studio'` maps bookings to this default resource).

### 4.3 Schedule rules (replaces manual 30-min slot rows)

```sql
-- Recurring availability windows (the weekly timetable)
create table public.availability_windows (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  resource_id  uuid references public.bookable_resources(id) on delete cascade, -- null = all
  day_of_week  int  not null check (day_of_week between 0 and 6),   -- 0 = Sunday
  start_time   time not null,            -- local time, interpreted in studio_settings.timezone
  end_time     time not null,
  is_active    boolean not null default true,
  unique (provider_id, resource_id, day_of_week, start_time, end_time)
);

-- One-off exceptions: closed days, holidays, vacation, lunch override
-- (supersedes/extracts provider_blocked_dates into a time-range-aware table)
create table public.blocked_periods (
  id           uuid primary key default gen_random_uuid(),
  provider_id  uuid not null references public.providers(id) on delete cascade,
  resource_id  uuid references public.bookable_resources(id) on delete cascade, -- null = all
  starts_at    timestamptz not null,
  ends_at      timestamptz not null,
  reason       text,
  is_active    boolean not null default true,
  constraint   valid_range check (ends_at > starts_at)
);
create index ... on blocked_periods (provider_id, resource_id);
```

If you keep the current `provider_blocked_dates` table, the engine treats it as
all-day blocked periods — but the range-based table above is strictly more
powerful (allows blocking "today 2–4 pm" for one artist) and is the recommended
replacement.

### 4.4 Bookings — hold actual times, reference a resource

Keep `public.bookings` (customers, payments, amounts already wired to Billplz) and
**add** time/scope columns rather than inventing a parallel table:

```sql
alter table public.bookings
  add column if not exists resource_id uuid references public.bookable_resources(id),
  add column if not exists starts_at timestamptz,
  add column if not exists ends_at   timestamptz,
  add column if not exists buffer_minutes int not null default 0,
  add column if not exists idempotency_key text;        -- unique per customer+key

create unique index if not exists bookings_idem_key
  on public.bookings (customer_id, idempotency_key) where idempotency_key is not null;
```

`availability_slots` is retired for new data (see §7 migration); `slot_id` stays
only as a legacy pointer until backfilled rows are re-homed.

**The anti-double-book guarantee** (replaces the `is_booked` flag):

```sql
-- No two ACTIVE bookings may overlap the same resource.
-- Using a range type lets Postgres do all conflict math atomically.
alter table public.bookings
  add constraint no_overlap_bookings
  exclude using gist (
    resource_id with =,
    tstzrange(starts_at, ends_at) with &&
  ) where (status in ('pending','confirmed','rescheduled'));
```

(`pending` is included because a pending booking still holds the time; if you want
pending reservations to expire, add a `hold_expires_at` and let the engine cancel
expired holds. If a GiST exclusion constraint is too invasive for the live table,
the equivalent guarantee is inside the booking RPCs via `SELECT ... FOR UPDATE` +
an explicit overlap `SELECT` — same as the existing
`create_booking_with_lock` pattern, generalized.)

> Note for multi-seat group bookings: with `max_bookings_per_slot > 1`, replace the
> hard exclusion on a single resource with a `booking_seats`/capacity model —
> excluded on a *virtual* resource per (resource, start, end) or enforced by
> counting active seats in the RPC. Keep the simple exclusion for the default
> `max_bookings_per_slot = 1`.

### 4.5 Booking lifecycle — a small state machine

Replace the ad-hoc string writes in `PATCH /api/bookings` with one column + one
function:

```sql
-- booking_status already exists as an enum; add any missing values
alter type public.booking_status add value if not exists 'no_show';   -- (values added in order)
-- recommended final set:
-- requested → confirmed → completed
--                  ↘ cancelled        (refund handled on payments, not status)
--       requested ↘ expired
--       confirmed ↘ no_show
```

Transitions live in one function `booking_transition(booking_id, event, actor_id,
payload)` that (a) checks the transition is legal for the current status, (b)
applies the update, (c) writes a `booking_events` row, (d) fires side effects
(payment refund via Billplz, email/webhook/notification, calendar event update).
UI and API both call this; no route may `update bookings set status` directly again.

---

## 5. The engine — public functions (single source of truth)

All in PL/pgSQL, `SECURITY INVOKER` + RLS where possible, called from the API
routes (or directly via PostgREST for the web app). Rough signatures:

```sql
-- Read side: "what can this customer book on this day?"
get_available_slots(
  p_provider_id uuid, p_resource_id uuid default null,
  p_service_id uuid,                      -- drives duration + which resources offer it
  p_date date, p_timezone text
) returns table (start_ts timestamptz, end_ts timestamptz, price_myr int)
```

Implementation = for each `availability_window` on that weekday (studio tz)
→ expand into candidate starts on the `slot_interval` grid
→ filter `starts_at >= now() + min_advance`, `ends_at <= now() + horizon`
→ subtract service duration + buffer
→ drop candidates overlapping any active booking or blocked period
→ group/split by resource when `resource_selection` is `room`/`artist`.

```sql
-- Write side: transactional, conflict-safe, idempotent
book_appointment(
  p_customer_id uuid, p_provider_id uuid, p_service_id uuid,
  p_resource_id uuid default null,          -- null → auto-pick / venue default
  p_start_ts timestamptz, p_timezone text,
  p_idempotency_key text default null,
  p_notes text default null
) returns jsonb          -- { ok: true, booking_id, total, deposit } | { ok:false, error, alternatives[] }
```

Body: validate settings (horizon, min advance) → `LOCK`/re-check overlap on the
resource in tz-aware terms → insert booking `pending` (+ optional payment-hold)
→ return next-best alternatives on conflict. The existing
`create_booking_with_lock()` RPC is the seed for this function — extend, don't
discard it.

```sql
booking_transition(p_booking_id uuid, p_event text, p_actor_id uuid, p_payload jsonb default '{}')
  -- confirm | cancel | complete | no_show | reschedule | expire | refund
schedule_change(...)   -- upsert availability_windows / blocked_periods as one tx
```

### Concurrency story

- **Same resource, same instant, two customers:** the exclusion constraint
  (or `FOR UPDATE` inside `book_appointment`) means exactly one insert wins; the
  loser gets `409` + the 3 nearest alternative starts. 
- **Idempotency:** customer + `idempotency_key` unique index makes retries after
  network timeouts safe (a retried payment webhook cannot create a second booking).
- **Staff editing schedule while someone books:** schedule edits and blocking run
  in the same transactional engine, so a window removed between the customer's
  "available" query and their "book" click is caught at book time.

---

## 6. Recommended build order for the studio app

What the studio-facing system looks like when done, in dependency order:

1. **Settings & schedule manager** (Studio dashboard)
   - Weekly opening-hours editor (`availability_windows`) — day × time range per
     resource or whole studio; reuse/extend `pro-availability-manager.tsx` into a
     true weekly-editor UI.
   - One-off blocked dates/hours (holidays, vacation) — evolve
     `provider_blocked_dates` UI into `blocked_periods`.
   - Studio settings form (timezone, buffers, horizon, auto-confirm, deposit,
     cancellation policy) → `studio_settings`.
2. **Resource manager** — manage `bookable_resources`; rename/extend the existing
   "Rooms" admin so artists/chairs/equipment are the same UI; keep gallery/photos.
3. **Customer booking flow** (web app / public studio page)
   - Service → (optional resource picker) → date → computed time slots → pay →
     `book_appointment`. Existing `booking-calendar.tsx` is the starting point,
     but it must read from `get_available_slots`, not `bookedSlots` flags.
4. **Booking inbox & calendar** (Studio dashboard)
   - List + day/week calendar of upcoming/requests; confirm / reschedule /
     cancel / no-show through `booking_transition`; drag-reschedule checks
     availability live.
5. **Operational automations**
   - Notifications: reminder/summary emails (Resend) at
     `reminder_minutes_before`; new-booking alerts (tables for notifications +
     realtime already exist in the repo).
   - Calendar sync: iCal feed per provider/resource + Google calendar write-back
     (schema already carries `google_calendar_event_id`).
6. **Reporting** — utilization per resource, booking sources, no-show rate,
   revenue by service; feeds the existing dashboard/payouts pages.

### API surface (studio + web apps both consume)

| Route | Purpose |
|---|---|
| `GET /api/availability?providerId&serviceId&date` | computed open slots (replace current materialized read) |
| `GET /api/resources?providerId` | resources + their windows (public subset) |
| `POST /api/bookings` | thin wrapper over `book_appointment()` |
| `PATCH /api/bookings` | wrapper over `booking_transition()` — replace the hand-rolled statusMap |
| `GET/POST/DELETE /api/schedule` | studio-only: windows + blocked periods |
| `GET/POST/PATCH /api/settings` | studio-only: `studio_settings` |
| `GET /api/bookings/calendar.ics` | public iCal availability |

---

## 7. Migration path from the current schema (low-risk, doable incrementally)

The live system already has bookings, payments and RLS — so migrate without a
big-bang rewrite:

1. **Additive schema first** (§4): `studio_settings`, `bookable_resources`,
   `availability_windows`, `blocked_periods`, new columns on `bookings`. Nothing
   existing is dropped or altered destructively. Ship engine RPCs alongside.
2. **Seed the resources** from `studio_rooms` + a default `venue` resource per
   studio so every studio works day one with `resource_selection='studio'`.
3. **Convert each studio's opening hours to windows.** One-time script: existing
   `availability_slots` rows grouped by (provider, weekday) → contiguous windows
   → `availability_windows`. Studios with no rows yet just define windows fresh
   (that's the "any studio" onboarding path — weeks in, not months).
4. **Point the studio dashboard availability editor at windows**; keep a
   read-only "legacy slots" view only for dates that already have confirmed
   bookings in `availability_slots`.
5. **Switch new availability reads/writes to the engine**, keep the booking
   creation path temporarily on `create_booking_with_lock` until
   `book_appointment` is verified (shadow-run both during QA comparing outcomes).
6. **Re-home future legacy bookings:** confirmed bookings that are still ahead of
   `now()` get their times copied into `starts_at/ends_at`; only then retire the
   legacy writes to `availability_slots`. Keep the table for history/reporting.
7. **Ship the state machine** last, once statuses are confirmed not to be relied
   on in unexpected combinations in the web analytics/reporting queries.

Also worth doing as clean-up along the way:
- Unify on one DB access pattern for bookings (either Supabase-js or
  `postgres.js`, but route **all writes through RPCs**) so the two client layers
  can't drift.
- Move the hard-coded 30-min/24-hour constants out of API routes into
  `studio_settings` + engine parameters (they're already duplicated in at least
  two apps).

---

## 8. Decisions to confirm before implementation

| Decision | Options | My recommendation |
|---|---|---|
| Bookable unit per studio | whole-studio only / rooms / artists / **mixed resources** | Mixed via `bookable_resources` — covers "any studio", defaults to whole-studio so nothing breaks |
| Slot model | keep 30-min fixed grid / **variable intervals** | Variable (service-duration-driven); expose `slot_interval` as a per-studio grid for studios that want fixed slots |
| Conflicts | GiST exclusion constraint on bookings / RPC `FOR UPDATE` checks | Start with RPC checks (matches existing `create_booking_with_lock`), add the exclusion constraint behind a feature flag once bookings have stable `starts_at/ends_at` |
| Schedule entry | per-weekday windows only / + advanced recurring rules (fortnightly, "every 2nd Sat") | Per-weekday windows first; advanced recurrence later — 90% of studios only need weekly |
| Vertical scope | beauty-only providers / any studio business on Leish | Design engine generic (it costs nothing extra); gate onboarding by provider kind if product wants to stay beauty-only at first |
| Auto vs manual confirm | platform default per studio | `studio_settings.auto_confirm` default `false` for studios today (existing behaviour), opt-in to auto-confirm |
| Group/multi-seat bookings | out of scope / capacity model | Out of scope for v1; leave `capacity` + `max_bookings_per_slot` columns for later |

---

## 9. Anti-patterns to avoid (learned from the current code)

- ❌ Pre-creating slot rows and flipping an `is_booked` boolean (stale rows, races).
- ❌ Enforcing availability in the client/app layer only ("read slot, insert, then
  mark") — always a double-booking window.
- ❌ Two write paths (Supabase-js *and* postgres.js) with rules in only one.
- ❌ Hard-coding business rules (duration, advance notice, deposit) in API routes —
  they belong in `studio_settings` + the engine.
- ❌ Conflating payment state with booking state (a "cancelled" booking may still
  owe a refund; a paid booking may be unconfirmed).
- ❌ Storing local wall-clock times without the studio's IANA timezone.
- ❌ Free-form status strings — use the enum + state machine.

---

## 10. Implementation status (2026-09-07)

| Slice | Status | Where |
|---|---|---|
| Additive schema + engine (settings, resources, windows, blocked periods, interval bookings, RPCs) | ✅ Implemented | `supabase/migrations/20260907000000_studio_booking_engine.sql` |
| Computed availability API (engine + legacy fallback) | ✅ Implemented | `apps/studio/app/api/availability/route.ts` |
| Atomic booking + lifecycle state machine API | ✅ Implemented | `apps/studio/app/api/bookings/route.ts` (engine `book_appointment` / `booking_transition`, legacy slot path kept) |
| Studio schedule manager API (windows, blocked, resources, settings) | ✅ Implemented | `apps/studio/app/api/studio/schedule/route.ts` |
| Typed engine access layer | ✅ Implemented | `apps/studio/lib/services/studio-engine.ts` |
| Studio dashboard: weekly schedule / closures / resources / rules UI | ✅ Implemented (replaces legacy 30-min slot manager) | `apps/studio/components/schedule-manager.tsx`, `apps/studio/app/availability/page.tsx` |
| Customer-facing book flow wired to computed slots + payments | ✅ Implemented (marketplace, engine dual-mode) | `apps/web/components/booking-calendar.tsx` (legacy + engine slots), `apps/web/app/api/availability/route.ts` (computed or legacy), `apps/web/app/api/bookings/route.ts` (engine `book_appointment` path), existing Billplz create/webhook used unchanged |
| Studio app's own public book page (`apps/studio/app/[slug]/book`) | ⏳ Stub (pre-existing) | Customers book studios on the marketplace (`www.leish.my`); the studio app redirects sign-in there. Copy updated to reflect flexible scheduling |
| Engine SQL integration tests (real Postgres) + CI migration check | ✅ Implemented | `apps/web/test/engine/studio-booking-engine.integration.test.ts` + `baseline.sql`; CI job `engine-integration` (Postgres 16 service) + `migration-syntax` (pglast parse gate) in `.github/workflows/ci.yml` |
| Legacy slot → window backfill & retirement | ⏳ Next | one-time script when windows are adopted per studio |
| Group/multi-seat slots (`max_bookings_per_slot > 1`) | ⏳ Later | engine currently assumes 1 seat per slot |

Engine-facing behaviour notes (marketplace slice)

- `GET /api/availability` (both apps) runs in one of two modes:
  - **engine** — providers with `availability_windows` get computed slots; the call must carry a service (`serviceId` uuid or `service` name) or `durationMinutes`; responses include `mode: "engine"`, the studio `timezone`, and the studio's deposit rule (`depositMode`, `depositAmountMyr`).
  - **legacy** — unchanged 30-min pre-materialised `availability_slots` array contract (artists and not-yet-migrated studios keep working untouched).
  - Provider dashboard calls without a date/service keep the legacy array shape.
- The marketplace booking widget (`booking-calendar.tsx`) now understands both shapes and posts engine bookings (`startTs` + service name/timezone) or legacy bookings (`slotId`) accordingly; a 409 conflict shows "that time was just taken".
- Deposit options honour the studio's `studio_settings`: when a deposit rule exists (< total) the customer may pay the configured deposit, otherwise only full payment is offered; BNPL/30% remain legacy-only options. Payment still runs through the existing Billplz create route + webhook (which already updates any booking by id).
- Engine bookings are created with status `payment_required`; the existing Billplz webhook promotes them to `paid_deposit`/`paid_full`.

Notes
- Validation: migration SQL parses cleanly (pg parser via pglast — CI `migration-syntax` job parses all 66 migrations).
- The engine migration is now **executed and exercised against a real Postgres 18** by `apps/web/test/engine/studio-booking-engine.integration.test.ts` (applies `baseline.sql` + the engine migration, seeds a studio, then asserts availability math, deposit guidance, the atomic single-winner race, idempotency, and the full lifecycle). Run locally with `pnpm --filter @leish/web test:engine` when a Postgres is reachable at `TEST_DATABASE_URL`; CI's `engine-integration` job provides one. Without `TEST_DATABASE_URL` the suite skips cleanly.
- Running the migration against real Postgres surfaced two real engine defects, both fixed in the migration:
  1. **plpgsql OUT-param/column ambiguity** — `select duration_minutes, ... into ...` inside `get_available_slots`/`book_appointment` collided with the `RETURNS TABLE` OUT column of the same name (`column reference "duration_minutes" is ambiguous`, only visible at execution). Fixed by qualifying with a table alias.
  2. **Double booking under true concurrency** — the advisory-lock + re-check pattern is not race-proof when the RPC runs as one autocommit statement (the statement snapshot precedes the lock wait), so two concurrent bookings for the same slot both succeeded. Added a GiST **exclusion constraint** (`bookings_no_overlap_active`) over `(provider_id, resource_id, tstzrange(starts_at, ends_at))` for live statuses — the real invariant — and `book_appointment`/`booking_transition` now translate `exclusion_violation` into clean conflict responses. The buffered window is intentionally not part of the constraint because `timestamptz + interval` is STABLE (timezone-dependent) and index expressions must be IMMUTABLE.
- `@leish/studio` typechecks + lints clean. The only typecheck error in the workspace is the shared package's `@prisma/client` generation, which the sandbox network blocked (`binaries.prisma.sh` unreachable) — unrelated to this change; it resolves on environments where `pnpm install` can run `prisma generate`.
- The migration has not yet been applied via the repo's normal Supabase migration flow — CI validates it against vanilla Postgres 16; apply it to a live Supabase project before enabling engine UIs in production.
