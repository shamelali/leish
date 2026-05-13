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

  async resolveServiceId(providerId: string, serviceIdOrName: string) {
    const supabase = getServiceClient()

    // Try to match by UUID first, then by name
    const { data: service } = await supabase
      .from("services")
      .select("id")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .or(`id.eq.${serviceIdOrName},name.ilike.${serviceIdOrName}`)
      .limit(1)
      .single()

    return service?.id
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
      confirmed: ["paid_deposit", "paid_full", "canceled"],
      paid_deposit: ["completed", "canceled"],
      paid_full: ["completed", "refunded"],
      completed: [],
      canceled: [],
      refunded: [],
    }

    const current = booking.status
    if (current !== nextStatus && !allowedTransitions[current]?.includes(nextStatus)) {
      throw new Error(`Invalid transition ${current} -> ${nextStatus}`)
    }

    // If canceling, free up the slot
    if (nextStatus === "canceled" && booking.slot_id) {
      await supabase
        .from("availability_slots")
        .update({ is_booked: false })
        .eq("id", booking.slot_id)
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq("id", bookingId)

    if (updateError) {
      throw new Error(updateError.message)
    }

    // Create event
    await supabase.from("booking_events").insert({
      booking_id: bookingId,
      event_type: `status_changed_to_${nextStatus}`,
      event_payload: { previousStatus: current, newStatus: nextStatus },
    })

    return { id: bookingId, status: nextStatus }
  },
}
