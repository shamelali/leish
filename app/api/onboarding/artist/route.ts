import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

interface ServiceInput {
  name: string
  durationMinutes: number
  priceMyr: number
}

interface OnboardingPayload {
  userId: string
  slug: string
  displayName: string
  state: string
  district: string
  experience: string
  bio: string
  specialties: string[]
  hourlyRate: number
  services: ServiceInput[]
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

  // Verify user is an artist
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "artist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: OnboardingPayload
  try {
    payload = (await req.json()) as OnboardingPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { slug, displayName, state, district, experience, bio, specialties, hourlyRate, services } = payload

  if (!displayName?.trim() || !state?.trim() || !district?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!services?.length || services.some((s) => !s.name?.trim() || s.priceMyr <= 0)) {
    return NextResponse.json({ error: "At least one valid service is required" }, { status: 400 })
  }

  // Create provider row
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      owner_id: user.id,
      kind: "artist",
      slug,
      display_name: displayName.trim(),
      state: state.trim(),
      district: district.trim(),
      bio: bio?.trim() || null,
      experience: experience?.trim() || null,
      specialties,
      hourly_rate: hourlyRate,
      is_active: false, // pending Leish admin approval
      rating: 0,
      review_count: 0,
    })
    .select("id")
    .single()

  if (providerError || !provider) {
    console.error("[artist-onboarding] provider insert error:", providerError)
    // Handle duplicate slug
    if (providerError?.code === "23505") {
      return NextResponse.json(
        { error: "A profile with that name already exists. Please try a slightly different display name." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
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
    console.error("[artist-onboarding] services insert error:", servicesError)
    // Provider was created — don't fail the whole onboarding, just warn
  }

  return NextResponse.json({ ok: true, providerId: provider.id })
}
