import { NextResponse } from "next/server"
import type { Sql } from "postgres"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import type { StudioSettingsRow } from "@/lib/services/studio-engine"

/**
 * Studio schedule manager API (studio-owner only).
 *
 * GET    /api/studio/schedule?providerId=..   -> full snapshot
 * POST   /api/studio/schedule                 -> { action, ... }
 *   addWindow          { providerId, resourceId?, dayOfWeek, startTime, endTime }
 *   deleteWindow       { providerId, id }
 *   addBlocked         { providerId, resourceId?, startsAt, endsAt, reason? }
 *   deleteBlocked      { providerId, id }
 *   addResource        { providerId, kind, name, capacity?, refId? }
 *   setResourceActive  { providerId, id, isActive }
 *   deleteResource     { providerId, id }
 *   updateSettings     { providerId, ...StudioSettings fields (partial) }
 *
 * All writes go through plain SQL so the invariants live in the database.
 */
const RESOURCE_KINDS = ["venue", "room", "artist", "staff", "chair", "equipment", "other"]

type HandlerResult = Promise<NextResponse>

function isUuid(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)
}

function isTime(v: unknown): v is string {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(v)
}

function toPgTime(v: string): string {
  return v.length === 5 ? `${v}:00` : v
}

async function requireOwnedStudioProvider(userId: string, providerId?: string | null): Promise<{ providerId: string } | NextResponse> {
  const supabase = await getSupabaseSsrClient()
  const requested = providerId || null

  const query = requested
    ? supabase.from("providers").select("id").eq("id", requested).eq("owner_id", userId).maybeSingle()
    : supabase.from("providers").select("id").eq("owner_id", userId).eq("kind", "studio").limit(1).maybeSingle()

  const { data } = await query
  if (!data?.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  }
  return { providerId: data.id }
}

// ---------------------------------------------------------------------------
// Action handlers
// ---------------------------------------------------------------------------

async function handleAddWindow(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  const dayOfWeek = body.dayOfWeek as number
  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    return NextResponse.json({ error: "dayOfWeek must be 0-6" }, { status: 400 })
  }
  if (!isTime(body.startTime) || !isTime(body.endTime)) {
    return NextResponse.json({ error: "startTime/endTime must be HH:MM" }, { status: 400 })
  }
  const resourceId = body.resourceId ? (body.resourceId as string) : null
  if (resourceId && !isUuid(resourceId)) {
    return NextResponse.json({ error: "Invalid resourceId" }, { status: 400 })
  }
  const startTime = toPgTime(body.startTime as string)
  const endTime = toPgTime(body.endTime as string)
  if (endTime <= startTime) {
    return NextResponse.json({ error: "endTime must be after startTime" }, { status: 400 })
  }
  try {
    const [row] = await sql`
      insert into public.availability_windows
        (provider_id, resource_id, day_of_week, start_time, end_time)
      values (${providerId}, ${resourceId}, ${dayOfWeek}, ${startTime}, ${endTime})
      returning id, day_of_week, start_time, end_time, resource_id
    `
    return NextResponse.json({ ok: true, window: row })
  } catch {
    return NextResponse.json({ ok: false, error: "That window already exists" }, { status: 409 })
  }
}

async function handleDeleteWindow(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  if (!isUuid(body.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  await sql`
    delete from public.availability_windows
    where id = ${body.id} and provider_id = ${providerId}
  `
  return NextResponse.json({ ok: true })
}

async function handleAddBlocked(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  const startsAt = new Date(body.startsAt as string)
  const endsAt = new Date(body.endsAt as string)
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    return NextResponse.json({ error: "startsAt/endsAt must be valid ISO times" }, { status: 400 })
  }
  if (endsAt.getTime() <= startsAt.getTime()) {
    return NextResponse.json({ error: "endsAt must be after startsAt" }, { status: 400 })
  }
  const resourceId = body.resourceId ? (body.resourceId as string) : null
  const reason = typeof body.reason === "string" ? body.reason : null
  const [row] = await sql`
    insert into public.blocked_periods (provider_id, resource_id, starts_at, ends_at, reason)
    values (${providerId}, ${resourceId}, ${startsAt.toISOString()}, ${endsAt.toISOString()}, ${reason})
    returning id, starts_at, ends_at, reason, resource_id
  `
  return NextResponse.json({ ok: true, blocked: row })
}

async function handleDeleteBlocked(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  if (!isUuid(body.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  await sql`
    delete from public.blocked_periods
    where id = ${body.id} and provider_id = ${providerId}
  `
  return NextResponse.json({ ok: true })
}

async function handleAddResource(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  const kind = body.kind as string
  if (!RESOURCE_KINDS.includes(kind)) {
    return NextResponse.json({ error: `kind must be one of ${RESOURCE_KINDS.join(", ")}` }, { status: 400 })
  }
  const name = typeof body.name === "string" ? body.name.trim() : ""
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 })
  const capacity = Number.isInteger(body.capacity) && (body.capacity as number) >= 1 ? (body.capacity as number) : 1
  const refId = body.refId ? (body.refId as string) : null
  try {
    const [row] = await sql`
      insert into public.bookable_resources (provider_id, kind, name, capacity, ref_id)
      values (${providerId}, ${kind}, ${name}, ${capacity}, ${refId})
      returning id, kind, name, capacity, is_active
    `
    return NextResponse.json({ ok: true, resource: row })
  } catch {
    return NextResponse.json({ ok: false, error: "Resource already exists" }, { status: 409 })
  }
}

async function handleSetResourceActive(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  if (!isUuid(body.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  if (typeof body.isActive !== "boolean") return NextResponse.json({ error: "isActive is required" }, { status: 400 })
  const [row] = await sql`
    update public.bookable_resources
    set is_active = ${body.isActive}
    where id = ${body.id} and provider_id = ${providerId}
    returning id
  `
  if (!row) return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

async function handleDeleteResource(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  if (!isUuid(body.id)) return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  const [row] = await sql`
    delete from public.bookable_resources
    where id = ${body.id} and provider_id = ${providerId}
    returning id
  `
  if (!row) return NextResponse.json({ error: "Resource not found" }, { status: 404 })
  return NextResponse.json({ ok: true })
}

async function handleUpdateSettings(sql: Sql, providerId: string, body: Record<string, unknown>): HandlerResult {
  const numeric = (v: unknown) => (v === undefined || v === null ? null : Number(v))
  const [row] = await sql<{ r: StudioSettingsRow | null }[]>`
    select public.upsert_studio_settings(
      ${providerId},
      ${typeof body.timezone === "string" ? body.timezone : null},
      ${numeric(body.slotInterval)},
      ${numeric(body.defaultBufferMin)},
      ${numeric(body.bookingHorizonDays)},
      ${numeric(body.minAdvanceMinutes)},
      ${typeof body.autoConfirm === "boolean" ? body.autoConfirm : null},
      ${typeof body.depositMode === "string" ? body.depositMode : null},
      ${numeric(body.depositAmount)},
      ${numeric(body.cancellationPolicyHours)},
      ${typeof body.allowCustomerCancel === "boolean" ? body.allowCustomerCancel : null},
      ${numeric(body.maxBookingsPerSlot)},
      ${Array.isArray(body.reminderMinutesBefore) ? (body.reminderMinutesBefore as number[]) : null},
      ${typeof body.resourceSelection === "string" ? body.resourceSelection : null}
    ) as r
  `
  return NextResponse.json({ ok: true, settings: row?.r ?? null })
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const url = new URL(req.url)
  const providerIdParam = url.searchParams.get("providerId")
  const owned = await requireOwnedStudioProvider(user.id, providerIdParam)
  if (owned instanceof NextResponse) return owned

  try {
    const sql = getSql()
    const [engineActive] = await sql<{ ok: boolean }[]>`
      select public.studio_has_windows(${owned.providerId}) as ok
    `
    const [legacyCount] = await sql<{ n: number }[]>`
      select count(*)::int as n
      from public.availability_slots
      where provider_id = ${owned.providerId} and is_booked = true and ends_at > now()
    `
    const [settingsRow] = await sql<StudioSettingsRow[]>`
      select * from public.studio_settings where provider_id = ${owned.providerId}
    `
    const resources = await sql`
      select id, provider_id, kind, ref_id, name, capacity, is_active, sort_order
      from public.bookable_resources
      where provider_id = ${owned.providerId}
      order by sort_order, kind, name
    `
    const windows = await sql`
      select id, provider_id, resource_id, day_of_week, start_time, end_time, is_active
      from public.availability_windows
      where provider_id = ${owned.providerId}
      order by day_of_week, start_time, resource_id nulls first
    `
    const blocked = await sql`
      select id, provider_id, resource_id, starts_at, ends_at, reason, is_active
      from public.blocked_periods
      where provider_id = ${owned.providerId}
      order by starts_at desc
    `
    return NextResponse.json({
      providerId: owned.providerId,
      engineActive: engineActive?.ok ?? false,
      legacyBookedCount: legacyCount?.n ?? 0,
      settings: settingsRow ?? null,
      resources,
      windows,
      blocked,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load schedule"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const action = body.action as string
  const owned = await requireOwnedStudioProvider(user.id, (body.providerId as string) || null)
  if (owned instanceof NextResponse) return owned

  const sql = getSql()
  const handlers: Record<string, (p: string, b: Record<string, unknown>) => Promise<NextResponse>> = {
    addWindow: (p, b) => handleAddWindow(sql, p, b),
    deleteWindow: (p, b) => handleDeleteWindow(sql, p, b),
    addBlocked: (p, b) => handleAddBlocked(sql, p, b),
    deleteBlocked: (p, b) => handleDeleteBlocked(sql, p, b),
    addResource: (p, b) => handleAddResource(sql, p, b),
    setResourceActive: (p, b) => handleSetResourceActive(sql, p, b),
    deleteResource: (p, b) => handleDeleteResource(sql, p, b),
    updateSettings: (p, b) => handleUpdateSettings(sql, p, b),
  }

  const handler = handlers[action]
  if (!handler) {
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }
  return handler(owned.providerId, body)
}
