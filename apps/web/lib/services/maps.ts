const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

function getKey() {
  if (!API_KEY) throw new Error("NEXT_PUBLIC_GOOGLE_MAPS_API_KEY not set")
  return API_KEY
}

type LatLng = { lat: number; lng: number }

export async function geocode(address: string): Promise<LatLng | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${getKey()}`,
  )
  const data = await res.json()
  if (data.status !== "OK") return null
  return data.results[0].geometry.location
}

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${getKey()}`,
  )
  const data = await res.json()
  if (data.status !== "OK") return null
  return data.results[0].formatted_address
}

export async function calcDistance(
  origin: string | LatLng,
  destination: string | LatLng,
): Promise<{ km: number; minutes: number } | null> {
  const fmt = (p: string | LatLng) =>
    typeof p === "string" ? p : `${p.lat},${p.lng}`

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(fmt(origin))}&destinations=${encodeURIComponent(fmt(destination))}&key=${getKey()}`,
  )
  const data = await res.json()
  if (data.status !== "OK") return null

  const row = data.rows[0]?.elements[0]
  if (!row || row.status !== "OK") return null

  return {
    km: row.distance.value / 1000,
    minutes: row.duration.value / 60,
  }
}

export async function calcTravelFee(
  customerAddress: string,
  providerId: string,
): Promise<{ fee: number; distanceKm: number } | null> {
  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )

  const { data: provider } = await supabase
    .from("providers")
    .select("district, free_travel_radius_km, travel_fee_per_km, max_travel_distance_km, outstation_flat_fee_myr")
    .eq("id", providerId)
    .single()

  if (!provider) return null

  const dist = await calcDistance(customerAddress, provider.district)
  if (!dist) return null

  const km = dist.km
  const freeRadius = provider.free_travel_radius_km || 0
  const feePerKm = provider.travel_fee_per_km || 0
  const maxDist = provider.max_travel_distance_km || 100
  const outstationFee = provider.outstation_flat_fee_myr || 0

  if (km > maxDist) return { fee: outstationFee + Math.max(0, km - freeRadius) * feePerKm, distanceKm: km }

  if (km <= freeRadius) return { fee: 0, distanceKm: km }

  return { fee: (km - freeRadius) * feePerKm, distanceKm: km }
}

export async function placeAutocomplete(input: string): Promise<{ label: string; placeId: string }[]> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:my&key=${getKey()}`,
  )
  const data = await res.json()
  if (data.status !== "OK") return []
  return data.predictions.map((p: any) => ({
    label: p.description,
    placeId: p.place_id,
  }))
}

export async function getPlaceDetails(placeId: string): Promise<{
  address: string
  lat: number
  lng: number
} | null> {
  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=formatted_address,geometry&key=${getKey()}`,
  )
  const data = await res.json()
  if (data.status !== "OK") return null
  return {
    address: data.result.formatted_address,
    lat: data.result.geometry.location.lat,
    lng: data.result.geometry.location.lng,
  }
}
