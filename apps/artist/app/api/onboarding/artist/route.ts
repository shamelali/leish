import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

interface ServiceInput { name: string; durationMinutes: number; priceMyr: number }
interface OnboardingPayload { userId: string; slug: string; displayName: string; state: string; district: string; experience: string; bio: string; specialties: string[]; hourlyRate: number; services: ServiceInput[] }

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile) {
    const { error: profileError } = await supabase.from("profiles").insert({
      id: user.id, full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User", role: "artist",
    })
    if (profileError) return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
  } else if (profile.role !== "artist") {
    const { error: updateError } = await supabase.from("profiles").update({ role: "artist" }).eq("id", user.id)
    if (updateError) return NextResponse.json({ error: "Failed to update role" }, { status: 500 })
  }

  let payload: OnboardingPayload
  try { payload = await req.json() } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }) }

  const { slug, displayName, state, district, experience, bio, specialties, hourlyRate, services } = payload
  if (!displayName?.trim() || !state?.trim() || !district?.trim()) return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  if (!services?.length || services.some((s) => !s.name?.trim() || s.priceMyr <= 0)) return NextResponse.json({ error: "At least one valid service is required" }, { status: 400 })

  const { data: provider, error: providerError } = await supabase.from("providers").insert({
    owner_id: user.id, kind: "artist", slug, display_name: displayName.trim(), state: state.trim(),
    district: district.trim(), bio: bio?.trim() || null, experience: experience?.trim() || null,
    specialties, hourly_rate: hourlyRate, is_active: true, rating: 0, review_count: 0,
  }).select("id").single()

  if (providerError || !provider) {
    if (providerError?.code === "23505") return NextResponse.json({ error: "A profile with that name already exists." }, { status: 409 })
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 })
  }

  const serviceRows = services.map((s) => ({ provider_id: provider.id, name: s.name.trim(), duration_minutes: s.durationMinutes, price_myr: s.priceMyr, is_active: true }))
  await supabase.from("services").insert(serviceRows)

  return NextResponse.json({ ok: true, providerId: provider.id, redirectTo: `/${slug}?onboarded=1` })
}
