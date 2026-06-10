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

// CRUD for availability slots (provider owner only)
export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")
  const dateKey = url.searchParams.get("date")
  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }
  
  let sql
  try {
    sql = getSql()
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }
  
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
