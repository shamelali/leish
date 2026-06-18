import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

interface BookingPayload {
  customerId: string
  providerId: string
  serviceId: string
  slotId: string
  notes?: string
  address?: string
  totalAmountMyr: number
}

interface PatchPayload {
  bookingId: string
  action: "confirm" | "cancel" | "complete" | "refund" | "reschedule"
  slotId?: string
}

export async function POST(req: Request) {
  let payload: BookingPayload
  try {
    payload = (await req.json()) as BookingPayload
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    )
  }

  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

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
        customer_id: payload.customerId,
        provider_id: payload.providerId,
        service_id: payload.serviceId,
        slot_id: payload.slotId,
        notes: payload.notes || null,
        total_amount_myr: payload.totalAmountMyr,
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
    const message = error instanceof Error ? error.message : "Booking failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
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

async function getUserRole(supabase: any, userId: string) {
  const { data } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle()
  return data?.role ?? null
}

async function getBookingOwnerId(supabase: any, providerId: string) {
  const { data } = await supabase.from("providers").select("owner_id").eq("id", providerId).maybeSingle()
  return data?.owner_id ?? null
}

async function freeSlot(supabase: any, slotId: string | null) {
  if (slotId) {
    await supabase.from("availability_slots").update({ is_booked: false }).eq("id", slotId)
  }
}

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: PatchPayload
  try {
    payload = (await req.json()) as PatchPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", payload.bookingId)
      .maybeSingle()

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    const ownerId = await getBookingOwnerId(supabase, booking.provider_id)
    const role = await getUserRole(supabase, user.id)
    const isOwner = ownerId === user.id
    const isAdmin = role === "admin"
    const isCustomer = booking.customer_id === user.id

    if (isCustomer && payload.action === "cancel") {
      await supabase.from("bookings").update({ status: "canceled" }).eq("id", payload.bookingId)
      await freeSlot(supabase, booking.slot_id)
      return NextResponse.json({ ok: true })
    }

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }

    const statusMap: Record<string, string> = {
      confirm: "confirmed",
      complete: "completed",
      cancel: "canceled",
      refund: "refunded",
    }
    const nextStatus = statusMap[payload.action]
    if (!nextStatus) {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 })
    }

    await supabase.from("bookings").update({ status: nextStatus }).eq("id", payload.bookingId)

    if (nextStatus === "canceled") {
      await freeSlot(supabase, booking.slot_id)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
