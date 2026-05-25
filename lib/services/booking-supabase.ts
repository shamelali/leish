// Supabase-based booking service - does not require DATABASE_URL
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

const statusSupportCache = new Map<string, boolean>()

async function isStatusSupported(supabase: ReturnType<typeof getServiceClient>, status: string) {
  if (statusSupportCache.has(status)) {
    return statusSupportCache.get(status) as boolean
  }

  const customer = "22222222-2222-2222-2222-222222222222"
  const provider = "11111111-1111-1111-1111-111111111111"
  const service = "00000000-0000-0000-0000-000000000003"

  const { error } = await supabase
    .from("bookings")
    .insert({
      customer_id: customer,
      provider_id: provider,
      service_id: service,
      slot_id: "00000000-0000-0000-0000-000000000000",
      status,
      total_amount_myr: 1,
      paid_amount_myr: 0,
    })

  const supported = !error || !error.message.includes("invalid input value for enum booking_status")
  statusSupportCache.set(status, supported)
  return supported
}

async function normalizeStatus(
  supabase: ReturnType<typeof getServiceClient>,
  status: string
) {
  if (status === "canceled" && (await isStatusSupported(supabase, "cancelled"))) {
    return "cancelled"
  }

  if ((status === "paid_deposit" || status === "paid_full") && (await isStatusSupported(supabase, "completed"))) {
    return "completed"
  }

  return status
}

async function getInitialBookingStatus(supabase: ReturnType<typeof getServiceClient>) {
  const candidates = ["payment_required", "pending", "confirmed"]
  for (const candidate of candidates) {
    if (await isStatusSupported(supabase, candidate)) {
      return candidate
    }
  }
  return "confirmed"
}

interface CreateBookingInput {
  customerId: string
  providerId: string
  serviceId: string
  slotId: string
  notes?: string
  totalAmountMyr: number
}

export const bookingSupabaseService = {
  async create(payload: CreateBookingInput) {
    const supabase = getServiceClient()

    // Use RPC to call atomic booking function with row locking
    // This prevents double-booking by using SELECT FOR UPDATE in a transaction
    const { data: bookingId, error: rpcError } = await supabase.rpc(
      "create_booking_with_lock",
      {
        p_customer_id: payload.customerId,
        p_provider_id: payload.providerId,
        p_service_id: payload.serviceId,
        p_slot_id: payload.slotId,
        p_total_amount_myr: payload.totalAmountMyr,
        p_notes: payload.notes ?? null,
      }
    )

    if (rpcError) {
      if (rpcError.message?.includes("invalid input value for enum public.booking_status: \"payment_required\"")) {
        return this.createFallback(supabase, payload)
      }
      // Handle specific error messages from the PostgreSQL function
      const errorMessage = rpcError.message || ""
      if (errorMessage.includes("Slot not found")) {
        throw new Error("Slot not found")
      }
      if (errorMessage.includes("24 hours")) {
        throw new Error("Bookings must be made at least 24 hours in advance")
      }
      if (errorMessage.includes("already booked")) {
        throw new Error("Slot is already booked")
      }
      throw new Error(rpcError.message || "Failed to create booking")
    }

    if (!bookingId) {
      throw new Error("Failed to create booking - no ID returned")
    }

    return { id: bookingId }
  },

  async createFallback(supabase: ReturnType<typeof getServiceClient>, payload: CreateBookingInput) {
    const { data: slot, error: slotError } = await supabase
      .from("availability_slots")
      .select("id, starts_at, is_booked")
      .eq("id", payload.slotId)
      .single()

    if (slotError || !slot) {
      throw new Error("Slot not found")
    }

    const startsAtMs = new Date(slot.starts_at).getTime()
    const minLeadMs = Date.now() + 24 * 60 * 60 * 1000
    if (startsAtMs < minLeadMs) {
      throw new Error("Bookings must be made at least 24 hours in advance")
    }
    if (slot.is_booked) {
      throw new Error("Slot is already booked")
    }

    const { data: updatedSlots, error: lockError } = await supabase
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", payload.slotId)
      .eq("is_booked", false)
      .select("id")

    if (lockError || !updatedSlots || updatedSlots.length === 0) {
      throw new Error("Slot is already booked")
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        customer_id: payload.customerId,
        provider_id: payload.providerId,
        service_id: payload.serviceId,
        slot_id: payload.slotId,
        status: await getInitialBookingStatus(supabase),
        notes: payload.notes ?? null,
        total_amount_myr: payload.totalAmountMyr,
        paid_amount_myr: 0,
      })
      .select("id")
      .single()

    if (bookingError || !booking) {
      await supabase
        .from("availability_slots")
        .update({ is_booked: false })
        .eq("id", payload.slotId)
      throw new Error(bookingError?.message || "Failed to create booking")
    }

    await supabase.from("booking_events").insert({
      booking_id: booking.id,
      event_type: "booking_created",
      event_payload: {
        providerId: payload.providerId,
        serviceId: payload.serviceId,
        slotId: payload.slotId,
      },
    })

    return { id: booking.id }
  },

  async resolveServiceId(providerId: string, serviceIdOrName: string) {
    const supabase = getServiceClient()

    const uuidLike = /^[0-9a-fA-F-]{36}$/.test(serviceIdOrName)
    if (uuidLike) {
      const { data: byId } = await supabase
        .from("services")
        .select("id")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .eq("id", serviceIdOrName)
        .maybeSingle()
      if (byId?.id) return byId.id
    }

    const { data: byName } = await supabase
      .from("services")
      .select("id")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .ilike("name", serviceIdOrName)
      .maybeSingle()

    return byName?.id ?? null
  },

  async listByUser(userId: string, isAdmin: boolean, providerId?: string | null) {
    const supabase = getServiceClient()

    if (isAdmin && providerId) {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("provider_id", providerId)
      return data ?? []
    }

    // Get bookings where user is customer OR owns the provider
    const { data } = await supabase
      .from("bookings")
      .select("*")
      .or(`customer_id.eq.${userId},provider_id.in.(select id from providers where owner_id = ${userId})`)

    return data ?? []
  },

  async getById(bookingId: string) {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (error) throw error
    return data
  },

  async transition(bookingId: string, nextStatus: string) {
    const supabase = getServiceClient()
    const normalizedNextStatus = await normalizeStatus(supabase, nextStatus)

    // Get current booking
    const { data: booking, error: fetchError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", bookingId)
      .single()

    if (fetchError || !booking) {
      throw new Error("Booking not found")
    }

    // Validate transition
    const allowedTransitions: Record<string, string[]> = {
      pending: ["payment_required", "canceled"],
      payment_required: ["confirmed", "canceled"],
      confirmed: ["paid_deposit", "paid_full", "completed", "canceled", "cancelled"],
      paid_deposit: ["completed", "canceled"],
      paid_full: ["completed", "refunded"],
      completed: [],
      canceled: [],
      refunded: [],
    }

    const current = booking.status
    const normalizedAllowedTransitions = (allowedTransitions[current] ?? []).map((s) =>
      s === "canceled" ? "cancelled" : s
    )
    if (current !== normalizedNextStatus && !normalizedAllowedTransitions.includes(normalizedNextStatus)) {
      throw new Error(`Invalid transition ${current} -> ${normalizedNextStatus}`)
    }

    // If canceling, free up the slot
    if ((normalizedNextStatus === "canceled" || normalizedNextStatus === "cancelled") && booking.slot_id) {
      await supabase
        .from("availability_slots")
        .update({ is_booked: false })
        .eq("id", booking.slot_id)
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: normalizedNextStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Create event
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
        event_type: `status_changed_to_${normalizedNextStatus}`,
        event_payload: { previousStatus: current, newStatus: normalizedNextStatus },
      })

    return { id: bookingId, status: normalizedNextStatus }
  },
}
