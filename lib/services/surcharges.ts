// Service for managing MUA additional charges (surcharges)
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

export type SurchargeType = "fixed" | "percentage" | "per_km" | "per_person"

export interface ServiceSurcharge {
  id: string
  providerId: string
  name: string
  description: string | null
  surchargeType: SurchargeType
  amountMyr: number
  percentage: number
  isActive: boolean
  appliesToDays: number[] // 0=Sun, 1=Mon...
  appliesBeforeHour: number | null
  appliesAfterHour: number | null
  minAdvanceBookingHours: number | null
  createdAt: string
  updatedAt: string
}

export interface BookingSurcharge {
  id: string
  bookingId: string
  surchargeId: string | null
  name: string
  amountMyr: number
  reason: string | null
  createdAt: string
}

export interface TravelFeeConfig {
  freeTravelRadiusKm: number
  travelFeePerKm: number
  maxTravelDistanceKm: number
  outstationFlatFeeMyr: number
}

export interface CalculatedSurcharge {
  surchargeId: string
  name: string
  description: string | null
  amountMyr: number
  reason: string
}

export const surchargeService = {
  // Get all surcharges for a provider
  async listByProvider(providerId: string): Promise<ServiceSurcharge[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("service_surcharges")
      .select("*")
      .eq("provider_id", providerId)
      .eq("is_active", true)
      .order("name")

    if (error) throw error
    return (data ?? []).map(this.mapRowToSurcharge)
  },

  // Create a new surcharge
  async create(payload: Omit<ServiceSurcharge, "id" | "createdAt" | "updatedAt">): Promise<ServiceSurcharge> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("service_surcharges")
      .insert({
        provider_id: payload.providerId,
        name: payload.name,
        description: payload.description,
        surcharge_type: payload.surchargeType,
        amount_myr: payload.amountMyr,
        percentage: payload.percentage,
        is_active: payload.isActive,
        applies_to_days: payload.appliesToDays,
        applies_before_hour: payload.appliesBeforeHour,
        applies_after_hour: payload.appliesAfterHour,
        min_advance_booking_hours: payload.minAdvanceBookingHours,
      })
      .select()
      .single()

    if (error) throw error
    return this.mapRowToSurcharge(data)
  },

  // Update a surcharge
  async update(id: string, payload: Partial<Omit<ServiceSurcharge, "id" | "createdAt" | "updatedAt">>): Promise<ServiceSurcharge> {
    const supabase = getServiceClient()
    const updateData: Record<string, unknown> = {}
    
    if (payload.name !== undefined) updateData.name = payload.name
    if (payload.description !== undefined) updateData.description = payload.description
    if (payload.surchargeType !== undefined) updateData.surcharge_type = payload.surchargeType
    if (payload.amountMyr !== undefined) updateData.amount_myr = payload.amountMyr
    if (payload.percentage !== undefined) updateData.percentage = payload.percentage
    if (payload.isActive !== undefined) updateData.is_active = payload.isActive
    if (payload.appliesToDays !== undefined) updateData.applies_to_days = payload.appliesToDays
    if (payload.appliesBeforeHour !== undefined) updateData.applies_before_hour = payload.appliesBeforeHour
    if (payload.appliesAfterHour !== undefined) updateData.applies_after_hour = payload.appliesAfterHour
    if (payload.minAdvanceBookingHours !== undefined) updateData.min_advance_booking_hours = payload.minAdvanceBookingHours
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("service_surcharges")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) throw error
    return this.mapRowToSurcharge(data)
  },

  // Delete a surcharge
  async delete(id: string): Promise<void> {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from("service_surcharges")
      .delete()
      .eq("id", id)

    if (error) throw error
  },

  // Get travel fee config for a provider
  async getTravelFeeConfig(providerId: string): Promise<TravelFeeConfig> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("providers")
      .select("free_travel_radius_km, travel_fee_per_km, max_travel_distance_km, outstation_flat_fee_myr")
      .eq("id", providerId)
      .single()

    if (error) throw error
    return {
      freeTravelRadiusKm: data.free_travel_radius_km ?? 0,
      travelFeePerKm: data.travel_fee_per_km ?? 0,
      maxTravelDistanceKm: data.max_travel_distance_km ?? 100,
      outstationFlatFeeMyr: data.outstation_flat_fee_myr ?? 0,
    }
  },

  // Update travel fee config
  async updateTravelFeeConfig(providerId: string, config: Partial<TravelFeeConfig>): Promise<void> {
    const supabase = getServiceClient()
    const updateData: Record<string, unknown> = {}
    
    if (config.freeTravelRadiusKm !== undefined) updateData.free_travel_radius_km = config.freeTravelRadiusKm
    if (config.travelFeePerKm !== undefined) updateData.travel_fee_per_km = config.travelFeePerKm
    if (config.maxTravelDistanceKm !== undefined) updateData.max_travel_distance_km = config.maxTravelDistanceKm
    if (config.outstationFlatFeeMyr !== undefined) updateData.outstation_flat_fee_myr = config.outstationFlatFeeMyr
    updateData.updated_at = new Date().toISOString()

    const { error } = await supabase
      .from("providers")
      .update(updateData)
      .eq("id", providerId)

    if (error) throw error
  },

  // Calculate travel fee based on distance
  async calculateTravelFee(providerId: string, distanceKm: number): Promise<number> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .rpc("calculate_travel_fee", {
        p_provider_id: providerId,
        p_distance_km: distanceKm,
      })

    if (error) throw error
    return data ?? 0
  },

  // Get applicable surcharges for a booking slot
  async getApplicableSurcharges(
    providerId: string,
    slotStart: string,
    bookingCreatedAt?: string
  ): Promise<CalculatedSurcharge[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .rpc("get_applicable_surcharges", {
        p_provider_id: providerId,
        p_slot_start: slotStart,
        p_booking_created_at: bookingCreatedAt ?? new Date().toISOString(),
      })

    if (error) throw error
    return (data ?? []).map((row: Record<string, unknown>) => ({
      surchargeId: row.surcharge_id as string,
      name: row.name as string,
      description: row.description as string | null,
      amountMyr: row.amount_myr as number,
      reason: row.reason as string,
    }))
  },

  // Apply surcharges to a booking
  async applySurchargesToBooking(
    bookingId: string,
    surcharges: Array<{ surchargeId?: string; name: string; amountMyr: number; reason: string }>
  ): Promise<BookingSurcharge[]> {
    const supabase = getServiceClient()
    
    const inserts = surcharges.map((s) => ({
      booking_id: bookingId,
      surcharge_id: s.surchargeId ?? null,
      name: s.name,
      amount_myr: s.amountMyr,
      reason: s.reason,
    }))

    const { data, error } = await supabase
      .from("booking_surcharges")
      .insert(inserts)
      .select()

    if (error) throw error
    return (data ?? []).map(this.mapRowToBookingSurcharge)
  },

  // Get surcharges applied to a booking
  async getBookingSurcharges(bookingId: string): Promise<BookingSurcharge[]> {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from("booking_surcharges")
      .select("*")
      .eq("booking_id", bookingId)

    if (error) throw error
    return (data ?? []).map(this.mapRowToBookingSurcharge)
  },

  // Calculate total amount including surcharges
  async calculateTotalWithSurcharges(
    baseAmountMyr: number,
    providerId: string,
    slotStart: string,
    distanceKm?: number,
    additionalPeopleCount?: number
  ): Promise<{
    baseAmount: number
    surcharges: CalculatedSurcharge[]
    travelFee: number
    totalAmount: number
  }> {
    const surcharges = await this.getApplicableSurcharges(providerId, slotStart)
    let totalSurcharges = surcharges.reduce((sum, s) => sum + s.amountMyr, 0)

    // Calculate travel fee if distance provided
    let travelFee = 0
    if (distanceKm !== undefined && distanceKm > 0) {
      travelFee = await this.calculateTravelFee(providerId, distanceKm)
    }

    // Add per-person surcharges if applicable
    if (additionalPeopleCount && additionalPeopleCount > 0) {
      const perPersonSurcharges = await this.listByProvider(providerId)
      for (const s of perPersonSurcharges) {
        if (s.surchargeType === "per_person") {
          const amount = s.amountMyr * additionalPeopleCount
          surcharges.push({
            surchargeId: s.id,
            name: s.name,
            description: s.description,
            amountMyr: amount,
            reason: `${additionalPeopleCount} additional person(s)`,
          })
          totalSurcharges += amount
        }
      }
    }

    return {
      baseAmount: baseAmountMyr,
      surcharges,
      travelFee,
      totalAmount: baseAmountMyr + totalSurcharges + travelFee,
    }
  },

  // Helper: Map database row to ServiceSurcharge
  mapRowToSurcharge(row: Record<string, unknown>): ServiceSurcharge {
    return {
      id: row.id as string,
      providerId: row.provider_id as string,
      name: row.name as string,
      description: row.description as string | null,
      surchargeType: row.surcharge_type as SurchargeType,
      amountMyr: row.amount_myr as number,
      percentage: row.percentage as number,
      isActive: row.is_active as boolean,
      appliesToDays: (row.applies_to_days as number[]) ?? [],
      appliesBeforeHour: row.applies_before_hour as number | null,
      appliesAfterHour: row.applies_after_hour as number | null,
      minAdvanceBookingHours: row.min_advance_booking_hours as number | null,
      createdAt: row.created_at as string,
      updatedAt: row.updated_at as string,
    }
  },

  // Helper: Map database row to BookingSurcharge
  mapRowToBookingSurcharge(row: Record<string, unknown>): BookingSurcharge {
    return {
      id: row.id as string,
      bookingId: row.booking_id as string,
      surchargeId: row.surcharge_id as string | null,
      name: row.name as string,
      amountMyr: row.amount_myr as number,
      reason: row.reason as string | null,
      createdAt: row.created_at as string,
    }
  },
}

// Preset surcharge templates for common MUA scenarios
export const surchargePresets = {
  earlyMorning: {
    name: "Early Morning Surcharge",
    description: "Additional fee for appointments starting before 7:00 AM",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 100,
    appliesBeforeHour: 7,
  },
  lateNight: {
    name: "Late Night Surcharge",
    description: "Additional fee for appointments starting after 9:00 PM",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 100,
    appliesAfterHour: 21,
  },
  weekend: {
    name: "Weekend Surcharge",
    description: "Additional fee for Saturday and Sunday appointments",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 50,
    appliesToDays: [0, 6], // Sunday, Saturday
  },
  publicHoliday: {
    name: "Public Holiday Surcharge",
    description: "Additional fee for public holiday appointments (1.5x rate)",
    surchargeType: "percentage" as SurchargeType,
    amountMyr: 0,
    percentage: 50,
  },
  lastMinute: {
    name: "Last-Minute Booking",
    description: "Additional fee for bookings made less than 48 hours in advance",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 100,
    minAdvanceBookingHours: 48,
  },
  additionalPerson: {
    name: "Additional Person",
    description: "Per-person fee for extra makeup services (mother, sister, etc.)",
    surchargeType: "per_person" as SurchargeType,
    amountMyr: 150,
  },
  touchUp: {
    name: "Touch-Up Service",
    description: "Fee for touch-up after 4+ hours",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 100,
  },
  changeOfLook: {
    name: "Change of Look",
    description: "Fee for complete makeup change (e.g., ceremony to reception)",
    surchargeType: "fixed" as SurchargeType,
    amountMyr: 200,
  },
}
