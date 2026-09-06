import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

/**
 * Bookings API for the studio app.
 *
 * POST — create a booking.
 *   ENGINE payload (startTs present):      calls public.book_appointment() —
 *     atomic + conflict-safe. The customer is always the authenticated user.
 *   LEGACY payload (slotId present):       unchanged pre-engine path
 *     (booking row + is_booked flip) kept for compatibility.
 *
 * PATCH — transition a booking via public.booking_transition().
 *   { bookingId, action: confirm|cancel|complete|no_show|refund|reschedule,
 *     newStartTs?, resourceId? }
 *   Authorization + the status state machine live inside the function.
 */

interface EngineBookingPayload extends Record<string, unknown> {
  providerId: string
  serviceId?: string
  resourceId?: string
  startTs: string
  timezone?: string
  durationMinutes?: number
  priceMyr?: number
  notes?: string
  idempotencyKey?: string
  status?: "pending" | "payment_required"
}

interface LegacyBookingPayload {
  providerId: string
  serviceId?: string
  slotId?: string
  notes?: string
  totalAmountMyr?: number
}

interface TransitionPayload {
  bookingId: string
  action: "confirm" | "cancel" | "complete" | "no_show" | "refund" | "reschedule"
  newStartTs?: string
  resourceId?: string
}

interface EngineBookResult {
  ok: boolean
  duplicate?: boolean
  booking_id?: string
  total_amount_myr?: number
  deposit_mode?: string
  deposit_amount_myr?: number
  error?: string
  conflict?: boolean
  alternatives?: { resource_id: string; start_ts: string; end_ts: string }[]
}

interface TransitionResult {
  ok: boolean
  noop?: boolean
  booking_id?: string
  status?: string
}

function isEnginePayload(raw: Record<string, unknown>): raw is EngineBookingPayload {
  const startTs = (raw.startTs ?? raw.start_ts ?? raw.startsAt) as string | undefined
  return typeof startTs === "string" && startTs.length > 0
}

function errorResponse(error: unknown, fallback: string, status = 400) {
  const message = error instanceof Error ? error.message : fallback
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function createEngineBooking(userId: string, payload: EngineBookingPayload) {
  if (!payload.providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }
  const startTs = (payload.startTs ?? payload.start_ts ?? payload.startsAt) as string
  const parsedStart = new Date(startTs)
  if (Number.isNaN(parsedStart.getTime())) {
    return NextResponse.json({ error: "Invalid startTs" }, { status: 400 })
  }

  try {
    const sql = getSql()
    const [row] = await sql<{ r: EngineBookResult }[]>`
      select public.book_appointment(
        ${userId},
        ${payload.providerId},
        ${payload.serviceId ?? null},
        ${payload.resourceId ?? null},
        ${parsedStart.toISOString()},
        ${payload.timezone ?? null},
        ${payload.durationMinutes ?? null},
        ${payload.priceMyr ?? null},
        ${payload.notes ?? null},
        ${payload.idempotencyKey ?? null},
        ${payload.status ?? "pending"}
      ) as r
    `
    const r = row?.r
    if (!r?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: r?.error || "Booking failed",
          conflict: r?.conflict,
          alternatives: r?.alternatives,
        },
        { status: r?.conflict ? 409 : 400 },
      )
    }
    return NextResponse.json({
      ok: true,
      duplicate: r.duplicate ?? false,
      bookingId: r.booking_id,
      totalAmountMyr: r.total_amount_myr,
      depositMode: r.deposit_mode,
      depositAmountMyr: r.deposit_amount_myr,
    })
  } catch (error) {
    return errorResponse(error, "Booking failed")
  }
}

async function createLegacyBooking(userId: string, payload: LegacyBookingPayload) {
  if (!payload.providerId || !payload.slotId) {
    return NextResponse.json({ error: "Missing slotId or startTs" }, { status: 400 })
  }
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: slot } = await supabase
      .from("availability_slots")
      .select("id, is_booked")
      .eq("id", payload.slotId)
      .maybeSingle()

    if (!slot || slot.is_booked) {
      return NextResponse.json({ ok: false, error: "Slot unavailable" }, { status: 400 })
    }

    const { data: booking, error } = await supabase
      .from("bookings")
      .insert({
        customer_id: userId,
        provider_id: payload.providerId,
        service_id: payload.serviceId ?? null,
        slot_id: payload.slotId,
        notes: payload.notes || null,
        total_amount_myr: payload.totalAmountMyr ?? 0,
        status: "pending",
      })
      .select()
      .maybeSingle()

    if (error || !booking) {
      return NextResponse.json({ ok: false, error: error?.message || "Booking failed" }, { status: 400 })
    }

    await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", payload.slotId)

    return NextResponse.json({ ok: true, bookingId: booking.id })
  } catch (error) {
    return errorResponse(error, "Booking failed")
  }
}

export async function POST(req: Request) {
  let payload: Record<string, unknown>
  try {
    payload = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  if (isEnginePayload(payload)) {
    return createEngineBooking(user.id, payload)
  }
  return createLegacyBooking(user.id, payload as unknown as LegacyBookingPayload)
}

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")

  let query = supabase
    .from("bookings")
    .select(`
      *,
      profiles!customer_id(full_name, email),
      services(name)
    `)
    .order("created_at", { ascending: false })

  if (providerId) {
    query = query.eq("provider_id", providerId)
  } else {
    const { data: studio } = await supabase
      .from("providers")
      .select("id")
      .eq("owner_id", user.id)
      .eq("kind", "studio")
      .maybeSingle()
    if (studio) {
      query = query.eq("provider_id", studio.id)
    } else {
      query = query.eq("customer_id", user.id)
    }
  }

  const { data: rows, error } = await query

  if (error) {
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 })
  }
  return NextResponse.json(rows)
}

export async function PATCH(req: Request) {
  let payload: TransitionPayload
  try {
    payload = (await req.json()) as TransitionPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!payload.bookingId || !payload.action) {
    return NextResponse.json({ error: "bookingId and action are required" }, { status: 400 })
  }

  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    const sql = getSql()
    const reschedulePayload =
      payload.action === "reschedule"
        ? JSON.stringify({
            newStartTs: payload.newStartTs ? new Date(payload.newStartTs).toISOString() : null,
            resourceId: payload.resourceId ?? null,
          })
        : "{}"

    const [row] = await sql<{ r: TransitionResult }[]>`
      select public.booking_transition(
        ${payload.bookingId},
        ${payload.action},
        ${user.id},
        ${reschedulePayload}::jsonb
      ) as r
    `
    const r = row?.r
    if (!r?.ok) {
      return NextResponse.json({ ok: false, error: "Transition failed" }, { status: 400 })
    }
    return NextResponse.json({
      ok: true,
      noop: r.noop ?? false,
      bookingId: r.booking_id,
      status: r.status,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed"
    if (message.includes("Not authorized")) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
