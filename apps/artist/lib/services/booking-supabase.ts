import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase env vars")
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export const bookingSupabaseService = {
  async resolveServiceId(providerId: string, serviceId: string): Promise<string | null> {
    const supabase = getClient()
    const { data } = await supabase.from("services").select("id").eq("provider_id", providerId).eq("id", serviceId).maybeSingle()
    return data?.id ?? null
  },
  async create(payload: { customerId: string; providerId: string; serviceId: string; slotId: string; notes?: string; address?: string; totalAmountMyr: number }) {
    const supabase = getClient()
    const { data, error } = await supabase.from("bookings").insert({
      customer_id: payload.customerId, provider_id: payload.providerId, service_id: payload.serviceId,
      slot_id: payload.slotId, notes: payload.notes ?? null, address: payload.address ?? null,
      total_amount_myr: payload.totalAmountMyr, status: "pending",
    }).select().single()
    if (error) throw error
    return data
  },
  async getById(bookingId: string) {
    const supabase = getClient()
    const { data } = await supabase.from("bookings").select("*").eq("id", bookingId).maybeSingle()
    return data
  },
  async listByUser(userId: string, isAdmin: boolean, providerId?: string | null) {
    const supabase = getClient()
    let query = supabase.from("bookings").select("*")
    if (providerId) query = query.eq("provider_id", providerId)
    else if (!isAdmin) query = query.eq("customer_id", userId)
    const { data } = await query.order("created_at", { ascending: false })
    return data ?? []
  },
  async transition(bookingId: string, status: string) {
    const supabase = getClient()
    const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId)
    if (error) throw error
  },
}
