import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { engineHasWindows, fetchComputedSlots } from "@/lib/services/studio-engine"

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
 * GET /api/availability
 *
 * Availability for a provider. Runs in one of two modes:
 *
 *  - ENGINE mode (studio has availability_windows): open times are COMPUTED by
 *    public.get_available_slots() from weekly windows, service durations,
 *    buffers, blocked periods and existing bookings. Response rows:
 *      { resourceId, resourceName, resourceKind, startTs, endTs,
 *        durationMinutes, priceMyr, label }
 *
 *  - LEGACY mode (no windows yet): pre-materialised 30-minute
 *    availability_slots rows, kept for backwards compatibility while a studio
 *    migrates. Response rows:
 *      { id, slot, startsAt, endsAt, available }
 *
 * Query params: providerId (required), date (YYYY-MM-DD), serviceId,
 * resourceId, durationMinutes, priceMyr, timezone, mode=engine|legacy
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")
  const dateKey = url.searchParams.get("date")
  const serviceId = url.searchParams.get("serviceId")
  const resourceId = url.searchParams.get("resourceId")
  const timezoneParam = url.searchParams.get("timezone")
  const durationRaw = url.searchParams.get("durationMinutes")
  const priceRaw = url.searchParams.get("priceMyr")
  const forcedMode = url.searchParams.get("mode")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  let sql
  try {
    sql = getSql()
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const engineActive = await engineHasWindows(sql, providerId)
  const useEngine =
    forcedMode !== "legacy" && (forcedMode === "engine" || engineActive)

  if (useEngine) {
    // Resolve studio timezone when the caller did not pass one.
    let tz = timezoneParam || null
    if (!tz) {
      const [settings] = await sql<{ timezone: string }[]>`
        select timezone from public.studio_settings where provider_id = ${providerId}
      `
      tz = settings?.timezone || "Asia/Kuala_Lumpur"
    }

    const todayInTz = new Date().toLocaleDateString("en-CA", { timeZone: tz })
    const durationMinutes = durationRaw ? Number.parseInt(durationRaw, 10) : null
    const priceMyr = priceRaw ? Number.parseInt(priceRaw, 10) : null
    const dateKeyResolved = dateKey || todayInTz

    // Without a service (or explicit duration) there is nothing to compute.
    if (!serviceId && !durationRaw) {
      return NextResponse.json({
        mode: "engine",
        timezone: tz,
        date: dateKeyResolved,
        slots: [],
      })
    }

    const slots = await fetchComputedSlots(sql, {
      providerId,
      serviceId,
      resourceId,
      date: dateKeyResolved,
      timezone: tz,
      durationMinutes,
      priceMyr,
    })

    return NextResponse.json({
      mode: "engine",
      timezone: tz,
      date: dateKeyResolved,
      slots: slots.map((s) => ({
        resourceId: s.resourceId,
        resourceName: s.resourceName,
        resourceKind: s.resourceKind,
        startTs: s.startTs.toISOString(),
        endTs: s.endTs.toISOString(),
        durationMinutes: s.durationMinutes,
        priceMyr: s.priceMyr,
        label: formatSlotLabelTz(s.startTs.toISOString(), tz),
      })),
    })
  }

  // ---- LEGACY mode ------------------------------------------------------
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
  return NextResponse.json({ mode: "legacy", rows })
}

/**
 * POST /api/availability  — LEGACY: create a 30-minute availability slot row.
 * Deprecated for studios using the engine; kept so existing integrations keep
 * working. Studio schedule editors should use /api/studio/schedule instead.
 */
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
