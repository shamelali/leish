import type { Sql } from "postgres"

/**
 * Typed access to the studio booking engine (Postgres functions created by
 * supabase/migrations/20260907000000_studio_booking_engine.sql).
 *
 * These helpers are the ONLY place the app talks to the engine. Business
 * rules (advance notice, buffers, horizon, conflicts, state machine) live in
 * SQL — the API routes just marshal requests/responses.
 */

// ---------------------------------------------------------------------------
// DB row shapes (snake_case as stored)
// ---------------------------------------------------------------------------
export interface StudioSettingsRow {
  provider_id: string
  timezone: string
  slot_interval: number
  default_buffer_min: number
  booking_horizon_days: number
  min_advance_minutes: number
  auto_confirm: boolean
  deposit_mode: "none" | "percent" | "fixed"
  deposit_amount: number
  cancellation_policy_hours: number
  allow_customer_cancel: boolean
  max_bookings_per_slot: number
  reminder_minutes_before: number[] | null
  resource_selection: "studio" | "room" | "artist"
  created_at?: string
  updated_at?: string
}

export interface StudioSettings {
  providerId: string
  timezone: string
  slotInterval: number
  defaultBufferMin: number
  bookingHorizonDays: number
  minAdvanceMinutes: number
  autoConfirm: boolean
  depositMode: "none" | "percent" | "fixed"
  depositAmount: number
  cancellationPolicyHours: number
  allowCustomerCancel: boolean
  maxBookingsPerSlot: number
  reminderMinutesBefore: number[]
  resourceSelection: "studio" | "room" | "artist"
}

export interface ResourceRow {
  id: string
  provider_id: string
  kind: string
  ref_id: string | null
  name: string
  capacity: number
  is_active: boolean
  sort_order: number
}

export interface WindowRow {
  id: string
  provider_id: string
  resource_id: string | null
  day_of_week: number
  start_time: string // "HH:MM:SS"
  end_time: string
  is_active: boolean
}

export interface BlockedRow {
  id: string
  provider_id: string
  resource_id: string | null
  starts_at: string | Date
  ends_at: string | Date
  reason: string | null
  is_active: boolean
}

export interface ComputedSlotDbRow {
  resource_id: string
  resource_name: string
  resource_kind: string
  start_ts: Date
  end_ts: Date
  duration_minutes: number
  price_myr: number
}

export interface ComputedSlot {
  resourceId: string
  resourceName: string
  resourceKind: string
  startTs: Date
  endTs: Date
  durationMinutes: number
  priceMyr: number
}

export interface ScheduleSnapshot {
  engineActive: boolean
  legacyBookedCount: number
  settings: StudioSettings | null
  resources: ResourceRow[]
  windows: WindowRow[]
  blocked: BlockedRow[]
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
export function mapSettings(row: StudioSettingsRow | null | undefined): StudioSettings | null {
  if (!row) return null
  return {
    providerId: row.provider_id,
    timezone: row.timezone,
    slotInterval: row.slot_interval,
    defaultBufferMin: row.default_buffer_min,
    bookingHorizonDays: row.booking_horizon_days,
    minAdvanceMinutes: row.min_advance_minutes,
    autoConfirm: row.auto_confirm,
    depositMode: row.deposit_mode,
    depositAmount: Number(row.deposit_amount),
    cancellationPolicyHours: row.cancellation_policy_hours,
    allowCustomerCancel: row.allow_customer_cancel,
    maxBookingsPerSlot: row.max_bookings_per_slot,
    reminderMinutesBefore: row.reminder_minutes_before ?? [],
    resourceSelection: row.resource_selection,
  }
}

export function mapComputedSlots(rows: ComputedSlotDbRow[]): ComputedSlot[] {
  return rows.map((r) => ({
    resourceId: r.resource_id,
    resourceName: r.resource_name,
    resourceKind: r.resource_kind,
    startTs: r.start_ts,
    endTs: r.end_ts,
    durationMinutes: r.duration_minutes,
    priceMyr: r.price_myr,
  }))
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------
export async function engineHasWindows(sql: Sql, providerId: string): Promise<boolean> {
  const [row] = await sql<{ ok: boolean }[]>`
    select public.studio_has_windows(${providerId}) as ok
  `
  return row?.ok ?? false
}

export async function fetchComputedSlots(
  sql: Sql,
  opts: {
    providerId: string
    serviceId?: string | null
    resourceId?: string | null
    date?: string | null
    timezone?: string | null
    durationMinutes?: number | null
    priceMyr?: number | null
  },
): Promise<ComputedSlot[]> {
  const rows = await sql<ComputedSlotDbRow[]>`
    select distinct on (resource_id, start_ts)
      resource_id, resource_name, resource_kind,
      start_ts, end_ts, duration_minutes, price_myr
    from public.get_available_slots(
      ${opts.providerId},
      ${opts.serviceId ?? null},
      ${opts.resourceId ?? null},
      ${opts.date ?? null},
      ${opts.timezone ?? null},
      ${opts.durationMinutes ?? null},
      ${opts.priceMyr ?? null}
    )
    order by resource_id, start_ts
  `
  return mapComputedSlots(rows)
}

/** Everything the studio schedule dashboard needs in one round trip. */
export async function fetchScheduleSnapshot(sql: Sql, providerId: string): Promise<ScheduleSnapshot> {
  const [engineActive] = await sql<{ ok: boolean }[]>`
    select public.studio_has_windows(${providerId}) as ok
  `
  const [legacyCount] = await sql<{ n: number }[]>`
    select count(*)::int as n
    from public.availability_slots
    where provider_id = ${providerId} and is_booked = true and ends_at > now()
  `
  const [settingsRow] = await sql<StudioSettingsRow[]>`
    select * from public.studio_settings where provider_id = ${providerId}
  `
  const resources = await sql<ResourceRow[]>`
    select id, provider_id, kind, ref_id, name, capacity, is_active, sort_order
    from public.bookable_resources
    where provider_id = ${providerId}
    order by sort_order, kind, name
  `
  const windows = await sql<WindowRow[]>`
    select id, provider_id, resource_id, day_of_week, start_time, end_time, is_active
    from public.availability_windows
    where provider_id = ${providerId}
    order by day_of_week, start_time, resource_id nulls first
  `
  const blocked = await sql<BlockedRow[]>`
    select id, provider_id, resource_id, starts_at, ends_at, reason, is_active
    from public.blocked_periods
    where provider_id = ${providerId}
    order by starts_at desc
  `
  return {
    engineActive: engineActive?.ok ?? false,
    legacyBookedCount: legacyCount?.n ?? 0,
    settings: mapSettings(settingsRow),
    resources,
    windows,
    blocked,
  }
}
