import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

const THIRTY_MINUTES_MS = 30 * 60 * 1000
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

function formatSlotLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

function formatSlotLabelTz(iso: string, tz: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })
}

/**
 * Resolve a service reference for the availability engine. Accepts a uuid
 * (serviceId) or a service NAME (service) scoped to the provider.
 */
async function resolveService(
  sql: ReturnType<typeof getSql>,
  providerId: string,
  serviceId: string | null,
  serviceName: string | null,
): Promise<{ id: string; duration_minutes: number; price_myr: number } | null> {
  if (serviceId) {
    const [row] = await sql<{ id: string; duration_minutes: number; price_myr: number }[]>`
      select id, duration_minutes, price_myr from public.services
      where id = ${serviceId} and provider_id = ${providerId} and is_active
      limit 1
    `
    return row ?? null
  }
  if (serviceName) {
    const [row] = await sql<{ id: string; duration_minutes: number; price_myr: number }[]>`
      select id, duration_minutes, price_myr from public.services
      where provider_id = ${providerId} and name = ${serviceName} and is_active
      limit 1
    `
    return row ?? null
  }
  return null
}

// Providers that define weekly availability windows get COMPUTED slots from
// the studio booking engine. Response: { mode, timezone, date, slots }.
async function computeEngineAvailability(
  sql: ReturnType<typeof getSql>,
  params: {
    providerId: string
    dateKey: string | null
    serviceId: string | null
    serviceName: string | null
    resourceId: string | null
    timezoneParam: string | null
    durationRaw: string | null
    priceRaw: string | null
  },
): Promise<NextResponse | null> {
  const [engineRow] = await sql<{ ok: boolean }[]>`
    select public.studio_has_windows(${params.providerId}) as ok
  `
  if (!(engineRow?.ok ?? false)) return null

  // Provider dashboards still call this endpoint WITHOUT a date/service to
  // list legacy rows; keep the legacy array shape for those calls.
  if (!params.dateKey && !params.serviceId && !params.serviceName && !params.durationRaw) {
    return null
  }

  const [settingsRow] = await sql<{
    timezone: string
    deposit_mode: string | null
    deposit_amount: string | null
  }[]>`
    select timezone, deposit_mode, deposit_amount
    from public.studio_settings where provider_id = ${params.providerId}
  `
  const tz = params.timezoneParam || settingsRow?.timezone || "Asia/Kuala_Lumpur"
  const depositMode = settingsRow?.deposit_mode ?? "none"
  const depositAmountMyr = Math.ceil(Number(settingsRow?.deposit_amount ?? 0))

  const service = await resolveService(sql, params.providerId, params.serviceId, params.serviceName)
  const durationMinutes = params.durationRaw ? Number.parseInt(params.durationRaw, 10) : null
  const priceMyr = params.priceRaw ? Number.parseInt(params.priceRaw, 10) : null

  if (!service && !durationMinutes) {
    return NextResponse.json({
      mode: "engine",
      timezone: tz,
      date: params.dateKey,
      requiresService: true,
      depositMode,
      depositAmountMyr,
      slots: [],
    })
  }

  const todayInTz = new Date().toLocaleDateString("en-CA", { timeZone: tz })
  const resolvedDate = params.dateKey || todayInTz

  const rows = await sql<{
    resource_id: string
    resource_name: string
    resource_kind: string
    start_ts: Date
    end_ts: Date
    duration_minutes: number
    price_myr: number
  }[]>`
    select distinct on (resource_id, start_ts)
      resource_id, resource_name, resource_kind,
      start_ts, end_ts, duration_minutes, price_myr
    from public.get_available_slots(
      ${params.providerId},
      ${service?.id ?? null},
      ${params.resourceId ?? null},
      ${resolvedDate},
      ${tz},
      ${service ? null : durationMinutes},
      ${service ? null : priceMyr}
    )
    order by resource_id, start_ts
  `

  return NextResponse.json({
    mode: "engine",
    timezone: tz,
    date: resolvedDate,
    depositMode,
    depositAmountMyr,
    slots: rows.map((row) => ({
      resourceId: row.resource_id,
      resourceName: row.resource_name,
      resourceKind: row.resource_kind,
      startTs: row.start_ts.toISOString(),
      endTs: row.end_ts.toISOString(),
      durationMinutes: row.duration_minutes,
      priceMyr: row.price_myr,
      label: formatSlotLabelTz(row.start_ts.toISOString(), tz),
    })),
  })
}

// CRUD for availability slots (provider owner only)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")
  const dateKey = url.searchParams.get("date")
  const serviceId = url.searchParams.get("serviceId")
  const serviceName = url.searchParams.get("service")
  const resourceId = url.searchParams.get("resourceId")
  const timezoneParam = url.searchParams.get("timezone")
  const durationRaw = url.searchParams.get("durationMinutes")
  const priceRaw = url.searchParams.get("priceMyr")
  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  let sql
  try {
    sql = getSql()
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const engineResponse = await computeEngineAvailability(sql, {
    providerId,
    dateKey,
    serviceId,
    serviceName,
    resourceId,
    timezoneParam,
    durationRaw,
    priceRaw,
  })
  if (engineResponse) return engineResponse

  // ---- LEGACY mode (array contract, unchanged) ---------------------------
  let rows
  if (dateKey) {
    const rawRows = await sql<{
      id: string
      starts_at: string
      ends_at: string
      is_booked: boolean
    }[]>`
      select * from public.availability_slots
      where provider_id = ${providerId}
        and starts_at::date = ${dateKey}::date
      order by starts_at
    `
    const cutoff = Date.now() + TWENTY_FOUR_HOURS_MS
    rows = rawRows.map((row) => ({
      id: row.id,
      slot: formatSlotLabel(row.starts_at),
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      available: !row.is_booked && new Date(row.starts_at).getTime() >= cutoff,
    }))
  } else {
    rows = await sql`
      select * from public.availability_slots
      where provider_id = ${providerId}
      order by starts_at
    `
  }
  return NextResponse.json(rows)
}

function parseAvailabilityPayload(raw: unknown): { providerId: string; startsAt: string; endsAt: string } | null {
  const payload = raw as Record<string, unknown>
  const providerId = (payload.providerId || payload.provider_id) as string | undefined
  const startsAt = (payload.startsAt || payload.starts_at) as string | undefined
  const endsAt = (payload.endsAt || payload.ends_at) as string | undefined
  if (!providerId || !startsAt || !endsAt) return null
  return { providerId: providerId as string, startsAt: startsAt as string, endsAt: endsAt as string }
}

function validateSlotTimes(startsAt: string, endsAt: string): { startsAtDate: Date; endsAtDate: Date } | string {
  const startsAtDate = new Date(startsAt)
  const endsAtDate = new Date(endsAt)
  if (Number.isNaN(startsAtDate.getTime()) || Number.isNaN(endsAtDate.getTime())) return "Invalid start or end time"
  if (endsAtDate.getTime() - startsAtDate.getTime() !== THIRTY_MINUTES_MS) return "Availability slots must be exactly 30 minutes"
  const minutes = startsAtDate.getMinutes()
  if (minutes !== 0 && minutes !== 30) return "Start time must be on a 30-minute boundary (:00 or :30)"
  return { startsAtDate, endsAtDate }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let parsed: ReturnType<typeof parseAvailabilityPayload>
  try {
    parsed = parseAvailabilityPayload(await req.json())
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  if (!parsed) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

  const times = validateSlotTimes(parsed.startsAt, parsed.endsAt)
  if (typeof times === "string") return NextResponse.json({ error: times }, { status: 400 })

  const { data: prov } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", parsed.providerId)
    .maybeSingle()
  if (prov?.owner_id !== user.id) return NextResponse.json({ error: "Not allowed" }, { status: 403 })

  try {
    const sql = getSql()
    const [row] = await sql<{ id: string }[]>`
      insert into public.availability_slots (provider_id, starts_at, ends_at)
      values (${parsed.providerId}, ${times.startsAtDate.toISOString()}, ${times.endsAtDate.toISOString()})
      returning id
    `
    return NextResponse.json({ ok: true, slotId: row.id })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Create failed" }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const url = new URL(req.url)
  const slotId = url.searchParams.get("slotId")
  if (!slotId) {
    return NextResponse.json({ error: "Missing slotId" }, { status: 400 })
  }

  // verify slot belongs to provider owned by user
  const sql = getSql()
  const rows = await sql`
    select provider_id from public.availability_slots where id = ${slotId}
  `
  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  const provId = rows[0].provider_id
  const { data: prov } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", provId)
    .maybeSingle()
  if (prov?.owner_id !== user.id) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  }

  await sql`
    delete from public.availability_slots where id = ${slotId}
  `
  return NextResponse.json({ ok: true })
}
