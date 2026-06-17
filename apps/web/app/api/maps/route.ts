import { NextResponse } from "next/server"
import { placeAutocomplete, getPlaceDetails } from "@/lib/services/maps"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const query = url.searchParams.get("q")
  const placeId = url.searchParams.get("placeId")

  if (placeId) {
    const details = await getPlaceDetails(placeId)
    if (!details) {
      return NextResponse.json({ error: "Place not found" }, { status: 404 })
    }
    return NextResponse.json(details)
  }

  if (!query || query.length < 2) {
    return NextResponse.json({ predictions: [] })
  }

  const predictions = await placeAutocomplete(query)
  return NextResponse.json({ predictions })
}
