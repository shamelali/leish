import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

interface ServiceInput {
  name: string
  durationMinutes: number
  priceMyr: number
}

interface StudioOnboardingPayload {
  userId: string
  slug: string
  studioName: string
  studioType: string
  state: string
  district: string
  address: string
  bio: string
  specialties: string[]
  teamSize: string
  startingRate: number
  services: ServiceInput[]
  operatingHours: string
}

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "studio_manager") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: StudioOnboardingPayload
  try {
    payload = (await req.json()) as StudioOnboardingPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const {
    slug,
    studioName,
    studioType,
    state,
    district,
    address,
    bio,
    specialties,
    teamSize,
    startingRate,
    services,
    operatingHours,
  } = payload

  if (!studioName?.trim() || !state?.trim() || !district?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!services?.length || services.some((s) => !s.name?.trim() || s.priceMyr <= 0)) {
    return NextResponse.json({ error: "At least one valid service is required" }, { status: 400 })
  }

  // Studios go live only after Leish review — is_active: false
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      owner_id: user.id,
      kind: "studio",
      slug,
      display_name: studioName.trim(),
      state: state.trim(),
      district: district.trim(),
      address: address?.trim() || null,
      bio: bio?.trim() || null,
      studio_type: studioType || null,
      team_size: teamSize || null,
      specialties,
      hourly_rate: startingRate,
      operating_hours: operatingHours?.trim() || null,
      is_active: false, // pending Leish review
      rating: 0,
      review_count: 0,
    })
    .select("id")
    .single()

  if (providerError || !provider) {
    console.error("[studio-onboarding] provider insert error:", providerError)
    if (providerError?.code === "23505") {
      return NextResponse.json(
        { error: "A studio with that name already exists. Please try a slightly different name." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create studio" }, { status: 500 })
  }

  // Insert services
  const serviceRows = services.map((s) => ({
    provider_id: provider.id,
    name: s.name.trim(),
    duration_minutes: s.durationMinutes,
    price_myr: s.priceMyr,
    is_active: true,
  }))

  const { error: servicesError } = await supabase.from("services").insert(serviceRows)

  if (servicesError) {
    console.error("[studio-onboarding] services insert error:", servicesError)
  }

  return NextResponse.json({ ok: true, providerId: provider.id })
}
