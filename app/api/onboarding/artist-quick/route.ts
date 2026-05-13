import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

interface QuickOnboardingPayload {
  userId: string
  slug: string
  displayName: string
  state: string
  district: string
  service: {
    name: string
    priceMyr: number
    durationMinutes: number
  }
  profilePhoto?: string | null
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
    .select("role, id")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "artist") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let payload: QuickOnboardingPayload
  try {
    payload = (await req.json()) as QuickOnboardingPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { slug, displayName, state, district, service, profilePhoto } = payload

  // Validation
  if (!displayName?.trim() || !state?.trim() || !district?.trim()) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  if (!service?.name?.trim() || service.priceMyr <= 0) {
    return NextResponse.json({ error: "Valid service is required" }, { status: 400 })
  }

  // Check if artist already has a provider
  const { data: existingProvider } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "artist")
    .maybeSingle()

  if (existingProvider) {
    return NextResponse.json({ error: "Profile already exists" }, { status: 409 })
  }

  // Create provider row with minimal fields
  const { data: provider, error: providerError } = await supabase
    .from("providers")
    .insert({
      owner_id: user.id,
      kind: "artist",
      slug,
      display_name: displayName.trim(),
      state: state.trim(),
      district: district.trim(),
      is_active: true,
      rating: 0,
      review_count: 0,
      tier: "free",
      client_limit: 10,
      // Optional fields are left null - can be filled later
    })
    .select("id")
    .single()

  if (providerError || !provider) {
    console.error("[artist-quick-onboarding] provider insert error:", providerError)
    if (providerError?.code === "23505") {
      return NextResponse.json(
        { error: "A profile with that name already exists. Please try a slightly different display name." },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }

  // Insert service
  const { error: serviceError } = await supabase.from("services").insert({
    provider_id: provider.id,
    name: service.name.trim(),
    duration_minutes: service.durationMinutes || 60,
    price_myr: service.priceMyr,
    is_active: true,
  })

  if (serviceError) {
    console.error("[artist-quick-onboarding] service insert error:", serviceError)
    // Don't fail the whole onboarding, just log
  }

  // Save profile photo if provided
  if (profilePhoto) {
    const { error: assetError } = await supabase.from("provider_assets").insert({
      provider_id: provider.id,
      asset_type: "profile_photo",
      url: profilePhoto,
      is_primary: true,
    })

    if (assetError) {
      console.error("[artist-quick-onboarding] asset insert error:", assetError)
    }
  }

  return NextResponse.json({ 
    ok: true, 
    providerId: provider.id,
    message: "Profile created successfully" 
  })
}
