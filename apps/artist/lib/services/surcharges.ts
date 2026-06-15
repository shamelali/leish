import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase env vars")
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export type SurchargeType = "fixed" | "percentage" | "per_km" | "per_person"

export interface ServiceSurcharge {
  id: string; providerId: string; name: string; description: string | null
  surchargeType: SurchargeType; amountMyr: number; percentage: number; isActive: boolean
  appliesToDays: number[]; appliesBeforeHour: number | null; appliesAfterHour: number | null
  minAdvanceBookingHours: number | null; createdAt: string; updatedAt: string
}

export const surchargeService = {
  async listByProvider(providerId: string): Promise<ServiceSurcharge[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase.from("service_surcharges").select("*").eq("provider_id", providerId).eq("is_active", true).order("name")
    if (error) throw error
    return (data ?? []).map((r: any) => ({
      id: r.id, providerId: r.provider_id, name: r.name, description: r.description,
      surchargeType: r.surcharge_type as SurchargeType, amountMyr: r.amount_myr, percentage: r.percentage,
      isActive: r.is_active, appliesToDays: r.applies_to_days ?? [], appliesBeforeHour: r.applies_before_hour,
      appliesAfterHour: r.applies_after_hour, minAdvanceBookingHours: r.min_advance_booking_hours,
      createdAt: r.created_at, updatedAt: r.updated_at,
    }))
  },
  async create(payload: any): Promise<ServiceSurcharge> {
    const supabase = getServiceClient()
    const { data, error } = await supabase.from("service_surcharges").insert({
      provider_id: payload.providerId, name: payload.name, description: payload.description,
      surcharge_type: payload.surchargeType, amount_myr: payload.amountMyr, percentage: payload.percentage,
      is_active: payload.isActive, applies_to_days: payload.appliesToDays ?? [],
      applies_before_hour: payload.appliesBeforeHour ?? null, applies_after_hour: payload.appliesAfterHour ?? null,
      min_advance_booking_hours: payload.minAdvanceBookingHours ?? null,
    }).select().single()
    if (error) throw error
    return data as any
  },
  async applySurchargesToBooking(bookingId: string, surcharges: Array<{ name: string; amountMyr: number; reason: string }>) {
    const supabase = getServiceClient()
    const inserts = surcharges.map(s => ({ booking_id: bookingId, surcharge_id: null, name: s.name, amount_myr: s.amountMyr, reason: s.reason }))
    const { error } = await supabase.from("booking_surcharges").insert(inserts)
    if (error) throw error
  },
}

export const surchargePresets = {
  earlyMorning: { name: "Early Morning Surcharge", description: "Appointments before 7:00 AM", surchargeType: "fixed" as SurchargeType, amountMyr: 100, appliesBeforeHour: 7 },
  lateNight: { name: "Late Night Surcharge", description: "Appointments after 9:00 PM", surchargeType: "fixed" as SurchargeType, amountMyr: 100, appliesAfterHour: 21 },
  weekend: { name: "Weekend Surcharge", description: "Sat/Sun appointments", surchargeType: "fixed" as SurchargeType, amountMyr: 50, appliesToDays: [0, 6] },
  publicHoliday: { name: "Public Holiday Surcharge", description: "1.5x rate", surchargeType: "percentage" as SurchargeType, amountMyr: 0, percentage: 50 },
  lastMinute: { name: "Last-Minute Booking", description: "Less than 48h notice", surchargeType: "fixed" as SurchargeType, amountMyr: 100, minAdvanceBookingHours: 48 },
  additionalPerson: { name: "Additional Person", description: "Per extra person", surchargeType: "per_person" as SurchargeType, amountMyr: 150 },
  touchUp: { name: "Touch-Up Service", description: "After 4+ hours", surchargeType: "fixed" as SurchargeType, amountMyr: 100 },
  changeOfLook: { name: "Change of Look", description: "Complete makeup change", surchargeType: "fixed" as SurchargeType, amountMyr: 200 },
}
