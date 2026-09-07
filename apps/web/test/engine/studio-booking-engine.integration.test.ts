/**
 * Integration tests for the Studio Booking Engine
 * (supabase/migrations/20260907000000_studio_booking_engine.sql).
 *
 * Runs against a REAL Postgres — the migration is applied inside beforeAll on
 * top of the minimal Supabase-shaped baseline in ./baseline.sql, then the
 * engine's invariants are exercised through its public SQL functions.
 *
 * Requirements:
 *   - a Postgres reachable at TEST_DATABASE_URL (no Supabase stack needed;
 *     use the repo's `pnpm --filter @leish/web test:engine` or CI service)
 *   - without TEST_DATABASE_URL the whole suite is skipped (safe for default
 *     `vitest run` and for CI unit runs)
 *
 * npm script (apps/web): `pnpm test:engine`
 */
/* eslint-disable sonarjs/sql-queries --
 * This harness deliberately executes static SQL literals (fixed UUID/constant
 * test values only, never user input) to exercise the engine migration's own
 * functions; template variables are compile-time test constants. */
import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import { Client } from "pg"

const DATABASE_URL = process.env.TEST_DATABASE_URL || ""
const ENABLED = Boolean(DATABASE_URL)
const TZ = "Asia/Kuala_Lumpur"

const OWNER_ID = "10000000-0000-0000-0000-000000000001"
const CUSTOMER_ID = "10000000-0000-0000-0000-000000000002"
const PROVIDER_ID = "20000000-0000-0000-0000-000000000001"
const SERVICE_60 = "30000000-0000-0000-0000-000000000001" // 60 min, MYR 300
const SERVICE_120 = "30000000-0000-0000-0000-000000000002" // 120 min, MYR 450

interface Slot {
  resource_id: string
  start_ts: Date
  end_ts: Date
  duration_minutes: number
  price_myr: number
}

describe.skipIf(!ENABLED)("studio booking engine (integration)", () => {
  let db: Client

  beforeAll(async () => {
    db = new Client({ connectionString: DATABASE_URL })
    await db.connect()

    // Fresh database: drop + recreate the schemas the baseline owns (public,
    // plus the minimal auth stub) so repeated local runs stay idempotent,
    // then apply baseline + engine.
    await db.query("drop schema if exists auth cascade")
    await db.query("drop schema if exists public cascade")
    await db.query("create schema public")

    const baseline = readFileSync(
      fileURLToPath(new URL("./baseline.sql", import.meta.url)),
      "utf8",
    )
    const engine = readFileSync(
      fileURLToPath(
        new URL(
          "../../../../supabase/migrations/20260907000000_studio_booking_engine.sql",
          import.meta.url,
        ),
      ),
      "utf8",
    )
    await db.query(baseline) // multi-statement (simple query) is fine
    await db.query(engine)

    // Seed a studio: owner + customer users/profiles, provider, services,
    // the whole-studio venue resource.
    await db.query(`
      insert into auth.users (id, email) values
        ('${OWNER_ID}', 'owner@test.local'),
        ('${CUSTOMER_ID}', 'customer@test.local');
      insert into public.profiles (id, full_name, role) values
        ('${OWNER_ID}', 'Owner', 'studio_manager'),
        ('${CUSTOMER_ID}', 'Customer', 'customer');
      insert into public.providers (id, owner_id, kind, slug, display_name, state, district)
      values ('${PROVIDER_ID}', '${OWNER_ID}', 'studio', 'glam-test',
              'Glam Test Studio', 'Kuala Lumpur', 'KL');
      insert into public.services (id, provider_id, name, duration_minutes, price_myr) values
        ('${SERVICE_60}',  '${PROVIDER_ID}', 'Hourly Rental',   60,  300),
        ('${SERVICE_120}', '${PROVIDER_ID}', 'Bridal Session',  120, 450);
      insert into public.bookable_resources (provider_id, kind, name)
      values ('${PROVIDER_ID}', 'venue', 'Glam Test Studio (whole studio)');
    `)
  }, 120_000)

  afterAll(async () => {
    if (db) await db.end()
  })

  // Engine-friendly defaults + a clean slate before every test.
  beforeEach(async () => {
    await db.query(`
      delete from public.booking_events;
      delete from public.bookings;
      delete from public.availability_slots;
      delete from public.blocked_periods;
      delete from public.availability_windows;
      delete from public.studio_settings where provider_id = '${PROVIDER_ID}';
    `)
    await db.query(`select public.upsert_studio_settings(
      '${PROVIDER_ID}',
      '${TZ}', 15, 0, 365, 0, false, 'none', 0, 24, true, 1, null, 'studio'
    )`)
    // Weekly availability: every day 09:00-17:00 (studio local).
    for (let dow = 0; dow <= 6; dow++) {
      await db.query(`
        insert into public.availability_windows (provider_id, resource_id, day_of_week, start_time, end_time)
        values ('${PROVIDER_ID}', null, ${dow}, '09:00:00', '17:00:00')
      `)
    }
  }, 30_000)

  // ---- helpers ------------------------------------------------------------

  /** YYYY-MM-DD for a date `daysAhead` days from today, in the studio tz. */
  async function targetDate(daysAhead = 1): Promise<string> {
    const res = await db.query<{ d: string }>(`
      select to_char((now() at time zone '${TZ}')::date + ${daysAhead}, 'YYYY-MM-DD') as d
    `)
    return res.rows[0].d
  }

  async function openSlots(date: string, serviceId = SERVICE_60): Promise<Slot[]> {
    const res = await db.query<Slot>(`
      select resource_id, start_ts, end_ts, duration_minutes, price_myr
      from public.get_available_slots(
        '${PROVIDER_ID}', '${serviceId}', null, '${date}', '${TZ}', null, null
      )
      order by start_ts
    `)
    return res.rows
  }

  interface BookOutcome {
    ok: boolean
    booking_id?: string
    total_amount_myr?: number
    deposit_amount_myr?: number
    deposit_mode?: string
    conflict?: boolean
    duplicate?: boolean
    error?: string
  }

  async function book(
    startTs: Date,
    opts: { status?: string; key?: string; customerId?: string } = {},
  ): Promise<BookOutcome> {
    const res = await db.query<{ r: BookOutcome }>(`
      select public.book_appointment(
        '${opts.customerId ?? CUSTOMER_ID}',
        '${PROVIDER_ID}',
        '${SERVICE_60}',
        null,
        '${startTs.toISOString()}',
        '${TZ}',
        null, null,
        'test booking',
        ${opts.key ? `'${opts.key}'` : "null"},
        '${opts.status ?? "payment_required"}'
      ) as r
    `)
    return res.rows[0].r
  }

  async function transition(
    bookingId: string,
    event: string,
    actorId: string | null,
    payload: Record<string, unknown> = {},
  ) {
    const res = await db.query<{ r: { ok: boolean; status?: string; error?: string; noop?: boolean } }>(`
      select public.booking_transition(
        '${bookingId}',
        '${event}',
        ${actorId ? `'${actorId}'` : "null"},
        '${JSON.stringify(payload).replace(/'/g, "''")}'::jsonb
      ) as r
    `)
    return res.rows[0].r
  }

  async function settings(): Promise<Record<string, unknown>> {
    const res = await db.query(
      `select * from public.studio_settings where provider_id = '${PROVIDER_ID}'`,
    )
    return res.rows[0] as Record<string, unknown>
  }

  // ---- engine behaviour ----------------------------------------------------

  it("applies the engine migration (tables + functions exist)", async () => {
    const res = await db.query<{ n: number }>(`
      select count(*)::int as n
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname in ('get_available_slots', 'book_appointment',
                           'booking_transition', 'studio_has_windows',
                           'upsert_studio_settings')
    `)
    expect(res.rows[0].n).toBe(5)
    const t = await db.query<{ n: number }>(`
      select count(*)::int as n from pg_tables
      where schemaname = 'public'
        and tablename in ('studio_settings', 'bookable_resources',
                          'availability_windows', 'blocked_periods')
    `)
    expect(t.rows[0].n).toBe(4)
    // every provider got a settings row via the insert trigger + seeded venue
    const s = await db.query<{ n: number }>(
      `select count(*)::int as n from public.studio_settings where provider_id = '${PROVIDER_ID}'`,
    )
    expect(s.rows[0].n).toBe(1)
  })

  it("computes availability from weekly windows (09:00-17:00, 60-min service)", async () => {
    const date = await targetDate()
    const slots = await openSlots(date)
    // 9:00..16:00 inclusive on a 15-min grid = 29 starts for a 60-min service
    expect(slots.length).toBe(29)
    for (const s of slots) {
      expect(s.duration_minutes).toBe(60)
      expect(s.price_myr).toBe(300)
    }
    // first/last in studio-local time
    const first = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(slots[0].start_ts)
    const last = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(slots[slots.length - 1].start_ts)
    expect(first).toBe("09:00")
    expect(last).toBe("16:00")
  })

  it("excludes slots that overlap a legacy pre-booked availability slot", async () => {
    const date = await targetDate()
    const before = await openSlots(date)
    expect(before.length).toBe(29)

    // legacy row occupies 09:30-10:00 -> any 60-min start whose window
    // intersects [09:30, 10:00) disappears: 09:00, 09:15, 09:30, 09:45
    await db.query(`
      insert into public.availability_slots (provider_id, starts_at, ends_at, is_booked)
      values ('${PROVIDER_ID}',
              ('${date}' || ' 09:30:00')::timestamp at time zone '${TZ}',
              ('${date}' || ' 10:00:00')::timestamp at time zone '${TZ}',
              true)
    `)
    const after = await openSlots(date)
    expect(after.length).toBe(25)

    const labels = after.map((s) =>
      new Intl.DateTimeFormat("en-GB", {
        timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(s.start_ts),
    )
    for (const gone of ["09:00", "09:15", "09:30", "09:45"]) {
      expect(labels).not.toContain(gone)
    }
    expect(labels).toContain("10:00")
  })

  it("blocks a whole day when a blocked period covers it", async () => {
    const date = await targetDate()
    await db.query(`
      insert into public.blocked_periods (provider_id, resource_id, starts_at, ends_at, reason)
      values ('${PROVIDER_ID}', null,
              ('${date}' || ' 00:00:00')::timestamp at time zone '${TZ}',
              ('${date}' || ' 23:59:59')::timestamp at time zone '${TZ}',
              'Holiday')
    `)
    expect((await openSlots(date)).length).toBe(0)
  })

  it("books atomically with deposit guidance and holds the slot", async () => {
    const date = await targetDate()
    const slots = await openSlots(date)
    expect(slots.length).toBe(29)

    await db.query(`
      update public.studio_settings
      set deposit_mode = 'percent', deposit_amount = 20
      where provider_id = '${PROVIDER_ID}'
    `)

    const out = await book(slots[0].start_ts)
    expect(out.ok).toBe(true)
    expect(out.booking_id).toBeTruthy()
    expect(out.total_amount_myr).toBe(300)
    expect(out.deposit_mode).toBe("percent")
    expect(out.deposit_amount_myr).toBe(60) // ceil(300 * 20%)

    // the booked window and every start intersecting it (09:00-09:45) are gone
    const after = await openSlots(date)
    expect(after.length).toBe(25)
    const bookedStart = slots[0].start_ts.getTime()
    for (const s of after) {
      expect(s.start_ts.getTime() === bookedStart).toBe(false)
    }
    // the slot right after the window (10:00) is still offered
    const nextStart = new Intl.DateTimeFormat("en-GB", {
      timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
    }).format(after[0].start_ts)
    expect(nextStart).toBe("10:00")

    // an event trail was written
    const ev = await db.query<{ n: number }>(
      `select count(*)::int as n from public.booking_events where booking_id = '${out.booking_id}'`,
    )
    expect(ev.rows[0].n).toBeGreaterThanOrEqual(1)
  })

  it("lets exactly one of two simultaneous bookings win the same slot", async () => {
    const date = await targetDate()
    const slots = await openSlots(date)
    const start = slots[0].start_ts.toISOString()

    const a = new Client({ connectionString: DATABASE_URL })
    const b = new Client({ connectionString: DATABASE_URL })
    await a.connect()
    await b.connect()
    try {
      const [ra, rb] = await Promise.all([
        a.query<{ r: BookOutcome }>(`
          select public.book_appointment('${CUSTOMER_ID}', '${PROVIDER_ID}', '${SERVICE_60}',
            null, '${start}', '${TZ}', null, null, null, null, 'payment_required') as r`),
        b.query<{ r: BookOutcome }>(`
          select public.book_appointment('${CUSTOMER_ID}', '${PROVIDER_ID}', '${SERVICE_60}',
            null, '${start}', '${TZ}', null, null, null, null, 'payment_required') as r`),
      ])
      const wins = [ra.rows[0].r, rb.rows[0].r]
      const okCount = wins.filter((w) => w.ok).length
      const conflictCount = wins.filter((w) => !w.ok && w.conflict).length
      expect(okCount).toBe(1)
      expect(conflictCount).toBe(1)
    } finally {
      await a.end()
      await b.end()
    }
    // only one booking exists
    const n = await db.query<{ n: number }>(
      `select count(*)::int as n from public.bookings where provider_id = '${PROVIDER_ID}'`,
    )
    expect(n.rows[0].n).toBe(1)
  })

  it("is idempotent for retried requests sharing an idempotency key", async () => {
    const date = await targetDate()
    const slots = await openSlots(date)
    const key = "retry-key-1"
    const first = await book(slots[0].start_ts, { key })
    const second = await book(slots[0].start_ts, { key })
    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
    expect(second.duplicate).toBe(true)
    expect(second.booking_id).toBe(first.booking_id)
    const n = await db.query<{ n: number }>(
      `select count(*)::int as n from public.bookings where idempotency_key = '${key}'`,
    )
    expect(n.rows[0].n).toBe(1)
  })

  it("keeps settings when upserting a partial update", async () => {
    await db.query(`
      update public.studio_settings set deposit_mode = 'fixed', deposit_amount = 50
      where provider_id = '${PROVIDER_ID}'
    `)
    await db.query(`select public.upsert_studio_settings(
      '${PROVIDER_ID}', '${TZ}', null, null, null, null, null,
      'percent', null, null, null, null, null, null
    )`)
    const s = await settings()
    expect(s.deposit_mode).toBe("percent")
    // a NULL argument means "leave unchanged" — the previous amount survives
    expect(String(s.deposit_amount)).toBe("50.00")
    expect(s.timezone).toBe(TZ)
  })

  it("enforces the lifecycle state machine (confirm -> complete, terminal locked)", async () => {
    const date = await targetDate(2)
    const slots = await openSlots(date)
    const { booking_id } = await book(slots[0].start_ts, { status: "payment_required" })
    expect(booking_id).toBeTruthy()

    // owners/admins may confirm
    const confirmed = await transition(booking_id!, "confirm", OWNER_ID)
    expect(confirmed.ok).toBe(true)
    expect(confirmed.status).toBe("confirmed")

    const completed = await transition(booking_id!, "complete", OWNER_ID)
    expect(completed.ok).toBe(true)
    expect(completed.status).toBe("completed")

    // a customer cannot cancel a completed booking (terminal state)
    let threw = ""
    try {
      await transition(booking_id!, "cancel", CUSTOMER_ID)
    } catch (e) {
      threw = e instanceof Error ? e.message : String(e)
    }
    expect(threw).toContain("terminal")
  })

  it("lets the customer cancel within policy and frees the slot", async () => {
    const date = await targetDate(2) // +2 days so we're outside the 24h window
    const slots = await openSlots(date)
    const { booking_id } = await book(slots[0].start_ts, { status: "payment_required" })
    const cancelled = await transition(booking_id!, "cancel", CUSTOMER_ID)
    expect(cancelled.ok).toBe(true)
    expect(cancelled.status).toBe("canceled")
    // slot is offered again
    const after = await openSlots(date)
    expect(after.some((s) => s.start_ts.getTime() === slots[0].start_ts.getTime())).toBe(true)
  })

  it("reschedules a booking to a new open time and keeps its state", async () => {
    const date = await targetDate(2)
    const slots = await openSlots(date)
    // book (payment_required is the only valid initial status alongside pending)
    const { booking_id } = await book(slots[0].start_ts, { status: "payment_required" })
    expect(booking_id).toBeTruthy()
    const confirmed = await transition(booking_id!, "confirm", OWNER_ID)
    expect(confirmed.status).toBe("confirmed")

    // the earliest slot after the booked 09:00-10:00 window is 10:00
    const target = slots.find(
      (s) => s.start_ts.getTime() >= slots[0].start_ts.getTime() + 60 * 60 * 1000,
    )!
    expect(target.start_ts.getTime()).toBe(slots[0].start_ts.getTime() + 60 * 60 * 1000)

    const rescheduled = await transition(booking_id!, "reschedule", OWNER_ID, {
      newStartTs: target.start_ts.toISOString(),
    })
    expect(rescheduled.ok).toBe(true)
    expect(rescheduled.status).toBe("confirmed")

    const row = await db.query<{ starts_at: Date; ends_at: Date; resource_id: string | null }>(
      `select starts_at, ends_at, resource_id from public.bookings where id = '${booking_id}'`,
    )
    expect(row.rows[0].starts_at.getTime()).toBe(target.start_ts.getTime())
    expect(row.rows[0].ends_at.getTime()).toBe(target.start_ts.getTime() + 60 * 60 * 1000)
    // old time is free again, new time is taken
    const slotsAfter = await openSlots(date)
    expect(slotsAfter.some((s) => s.start_ts.getTime() === slots[0].start_ts.getTime())).toBe(true)
    expect(slotsAfter.some((s) => s.start_ts.getTime() === target.start_ts.getTime())).toBe(false)
  })

  it("rejects a reschedule to an already-booked time", async () => {
    const date = await targetDate(2)
    const slots = await openSlots(date)
    // first booking 09:00-10:00 (confirmed)
    const { booking_id } = await book(slots[0].start_ts, { status: "payment_required" })
    expect(booking_id).toBeTruthy()
    await transition(booking_id!, "confirm", OWNER_ID)
    // second booking at 10:00 (first slot after the 09:00 window is still free)
    const occupied = slots.find(
      (s) => s.start_ts.getTime() > slots[0].start_ts.getTime() + 60 * 60 * 1000,
    )!
    const second = await book(occupied.start_ts, { status: "payment_required" })
    expect(second.ok).toBe(true)

    let threw = ""
    try {
      await transition(booking_id!, "reschedule", OWNER_ID, {
        newStartTs: occupied.start_ts.toISOString(),
      })
    } catch (e) {
      threw = e instanceof Error ? e.message : String(e)
    }
    expect(threw).toContain("not available")
  })
})
