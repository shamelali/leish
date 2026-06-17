import { NextResponse } from "next/server"
import { calcTravelFee } from "@/lib/services/maps"
import { surchargeService } from "@/lib/services/surcharges"

export async function POST(req: Request) {
  let payload: { providerId: string; address: string; baseAmountMyr?: number; slotStart?: string }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!payload.providerId || !payload.address) {
    return NextResponse.json({ error: "Missing providerId or address" }, { status: 400 })
  }

  const result = await calcTravelFee(payload.address, payload.providerId)
  if (!result) {
    return NextResponse.json({ error: "Could not calculate travel fee" }, { status: 400 })
  }

  const config = await surchargeService.getTravelFeeConfig(payload.providerId)

  const total = payload.baseAmountMyr && payload.slotStart
    ? await surchargeService.calculateTotalWithSurcharges(
        payload.baseAmountMyr,
        payload.providerId,
        payload.slotStart,
        result.distanceKm,
      )
    : null

  return NextResponse.json({
    distanceKm: result.distanceKm,
    travelFee: result.fee,
    config,
    totalCalculation: total,
  })
}
