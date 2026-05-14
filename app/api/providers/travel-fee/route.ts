import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { surchargeService } from "@/lib/services/surcharges"
import { reportApiError } from "@/lib/ops/alerts"

// GET /api/providers/travel-fee?providerId=xxx - Get travel fee config
export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")
  const distanceKm = url.searchParams.get("distance")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  try {
    const config = await surchargeService.getTravelFeeConfig(providerId)
    
    // If distance provided, calculate the fee
    if (distanceKm) {
      const distance = parseFloat(distanceKm)
      if (isNaN(distance) || distance < 0) {
        return NextResponse.json({ error: "Invalid distance" }, { status: 400 })
      }
      
      const fee = await surchargeService.calculateTravelFee(providerId, distance)
      return NextResponse.json({
        config,
        distanceKm: distance,
        travelFee: fee,
        isOutstation: config.maxTravelDistanceKm > 0 && distance > config.maxTravelDistanceKm,
      })
    }

    return NextResponse.json({ config })
  } catch (error) {
    await reportApiError("travel_fee_get", error, { providerId })
    return NextResponse.json({ error: "Failed to fetch travel fee config" }, { status: 500 })
  }
}

// POST /api/providers/travel-fee - Update travel fee config (provider owner only)
export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: {
    providerId: string
    freeTravelRadiusKm?: number
    travelFeePerKm?: number
    maxTravelDistanceKm?: number
    outstationFlatFeeMyr?: number
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  // Verify ownership
  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", payload.providerId)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    await surchargeService.updateTravelFeeConfig(payload.providerId, {
      freeTravelRadiusKm: payload.freeTravelRadiusKm,
      travelFeePerKm: payload.travelFeePerKm,
      maxTravelDistanceKm: payload.maxTravelDistanceKm,
      outstationFlatFeeMyr: payload.outstationFlatFeeMyr,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    await reportApiError("travel_fee_post", error, { providerId: payload.providerId })
    const message = error instanceof Error ? error.message : "Failed to update travel fee config"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

// Calculate travel fee for a booking preview (public endpoint)
export async function PATCH(req: Request) {
  let payload: {
    providerId: string
    slotStart: string
    distanceKm?: number
    additionalPeopleCount?: number
    baseAmountMyr: number
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!payload.providerId || !payload.slotStart || payload.baseAmountMyr === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  try {
    const calculation = await surchargeService.calculateTotalWithSurcharges(
      payload.baseAmountMyr,
      payload.providerId,
      payload.slotStart,
      payload.distanceKm,
      payload.additionalPeopleCount
    )

    return NextResponse.json({
      ok: true,
      calculation,
    })
  } catch (error) {
    await reportApiError("surcharges_calculate", error, { providerId: payload.providerId })
    const message = error instanceof Error ? error.message : "Failed to calculate surcharges"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
