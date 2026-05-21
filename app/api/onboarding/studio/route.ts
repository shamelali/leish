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

// eslint-disable-next-line sonarjs/cognitive-complexity
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

  // If profile doesn't exist, create it with studio_manager role
  if (!profile) {
    console.log("[studio-onboarding] Profile missing, creating with studio_manager role")
    const { error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        role: "studio_manager",
      })

    if (profileError) {
      console.error("[studio-onboarding] Failed to create profile:", JSON.stringify(profileError, null, 2))
      return NextResponse.json({ error: "Failed to create user profile", detail: profileError?.message }, { status: 500 })
    }
  } else if (profile.role !== "studio_manager") {
    // Profile exists but wrong role — upgrade to studio_manager
    console.log("[studio-onboarding] Upgrading role from", profile.role, "to studio_manager")
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ role: "studio_manager" })
      .eq("id", user.id)

    if (updateError) {
      console.error("[studio-onboarding] Failed to update role:", JSON.stringify(updateError, null, 2))
      return NextResponse.json({ error: "Failed to update user role", detail: updateError?.message }, { status: 500 })
    }
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

  // Studios go live immediately on onboarding
  const insertPayload = {
    owner_id: user.id,
    kind: "studio" as const,
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
    starting_price: startingRate,
    operating_hours: operatingHours?.trim() || null,
    is_active: true,
    rating: 0,
    review_count: 0,
  }

  console.log("[studio-onboarding] Attempting insert:", JSON.stringify(insertPayload, null, 2))

  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert(insertPayload)
    .select("id")
    .single()

  if (providerError || !provider) {
    console.error("[studio-onboarding] Error:", JSON.stringify(providerError, null, 2))
    if (providerError?.code === "23505") {
      return NextResponse.json(
        { error: "A studio with that name already exists. Please try a slightly different name." },
        { status: 409 }
      )
    }
    if (providerError?.code === "23503") {
      return NextResponse.json({ error: "Account not found. Please sign in again." }, { status: 400 })
    }
    if (providerError?.code === "42501") {
      return NextResponse.json({ error: "Permission denied. Please ensure you have a studio manager account." }, { status: 403 })
    }
    return NextResponse.json({ error: `Database error: ${providerError?.message || "Unknown"}`, hint: providerError?.hint, code: providerError?.code }, { status: 500 })
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
