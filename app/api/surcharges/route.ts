import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { surchargeService, surchargePresets } from "@/lib/services/surcharges"
import { reportApiError } from "@/lib/ops/alerts"

// GET /api/surcharges?providerId=xxx - List surcharges for a provider
export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("providerId")
  const includePresets = url.searchParams.get("presets") === "true"

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  try {
    const surcharges = await surchargeService.listByProvider(providerId)
    
    if (includePresets) {
      return NextResponse.json({
        surcharges,
        presets: surchargePresets,
      })
    }
    
    return NextResponse.json(surcharges)
  } catch (error) {
    await reportApiError("surcharges_get", error, { providerId })
    return NextResponse.json({ error: "Failed to fetch surcharges" }, { status: 500 })
  }
}

// POST /api/surcharges - Create a new surcharge (provider owner only)
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
    name: string
    description?: string
    surchargeType: "fixed" | "percentage" | "per_km" | "per_person"
    amountMyr: number
    percentage?: number
    appliesToDays?: number[]
    appliesBeforeHour?: number
    appliesAfterHour?: number
    minAdvanceBookingHours?: number
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
    const surcharge = await surchargeService.create({
      providerId: payload.providerId,
      name: payload.name,
      description: payload.description ?? null,
      surchargeType: payload.surchargeType,
      amountMyr: payload.amountMyr,
      percentage: payload.percentage ?? 0,
      isActive: true,
      appliesToDays: payload.appliesToDays ?? [],
      appliesBeforeHour: payload.appliesBeforeHour ?? null,
      appliesAfterHour: payload.appliesAfterHour ?? null,
      minAdvanceBookingHours: payload.minAdvanceBookingHours ?? null,
    })

    return NextResponse.json({ ok: true, surcharge })
  } catch (error) {
    await reportApiError("surcharges_post", error, { providerId: payload.providerId })
    const message = error instanceof Error ? error.message : "Failed to create surcharge"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

// PATCH /api/surcharges - Update a surcharge
export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: {
    id: string
    name?: string
    description?: string
    surchargeType?: "fixed" | "percentage" | "per_km" | "per_person"
    amountMyr?: number
    percentage?: number
    isActive?: boolean
    appliesToDays?: number[]
    appliesBeforeHour?: number | null
    appliesAfterHour?: number | null
    minAdvanceBookingHours?: number | null
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  // Verify ownership through the surcharge's provider
  const { data: surcharge } = await supabase
    .from("service_surcharges")
    .select("provider_id")
    .eq("id", payload.id)
    .single()

  if (!surcharge) {
    return NextResponse.json({ error: "Surcharge not found" }, { status: 404 })
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", surcharge.provider_id)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const updated = await surchargeService.update(payload.id, {
      name: payload.name,
      description: payload.description,
      surchargeType: payload.surchargeType,
      amountMyr: payload.amountMyr,
      percentage: payload.percentage,
      isActive: payload.isActive,
      appliesToDays: payload.appliesToDays,
      appliesBeforeHour: payload.appliesBeforeHour,
      appliesAfterHour: payload.appliesAfterHour,
      minAdvanceBookingHours: payload.minAdvanceBookingHours,
    })

    return NextResponse.json({ ok: true, surcharge: updated })
  } catch (error) {
    await reportApiError("surcharges_patch", error, { surchargeId: payload.id })
    const message = error instanceof Error ? error.message : "Failed to update surcharge"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

// DELETE /api/surcharges?id=xxx - Delete a surcharge
export async function DELETE(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url)
  const id = url.searchParams.get("id")

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  // Verify ownership
  const { data: surcharge } = await supabase
    .from("service_surcharges")
    .select("provider_id")
    .eq("id", id)
    .single()

  if (!surcharge) {
    return NextResponse.json({ error: "Surcharge not found" }, { status: 404 })
  }

  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", surcharge.provider_id)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    await surchargeService.delete(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    await reportApiError("surcharges_delete", error, { surchargeId: id })
    const message = error instanceof Error ? error.message : "Failed to delete surcharge"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
