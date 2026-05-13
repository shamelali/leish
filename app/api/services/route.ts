import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { serviceService } from "@/lib/services/db"

// Generic service management for providers. GET queries list, POST creates,
// PATCH updates, DELETE removes. Ownership is enforced via Supabase.
type ServiceCreatePayload = {
  providerId?: string
  name?: string
  durationMinutes?: number
  priceMyr?: number
}

type ServicePatchPayload = {
  id?: string
  providerId?: string
  updates?: Record<string, unknown>
}

type ServiceDeletePayload = {
  id?: string
  providerId?: string
}

function isNotPermError(err: unknown) {
  return err instanceof Error && err.message === "not-perm"
}

export async function GET(req: Request) {
  const url = new URL(req.url)
  const providerId = url.searchParams.get("provider_id")
  if (!providerId) {
    // return all active services (public) - used for marketplace browsing
    const sql = getSql()
    const rows = await sql`select * from public.services where is_active = true`
    return NextResponse.json(rows)
  }
  // return list for specific provider
  try {
    const rows = await serviceService.listByProvider(providerId)
    return NextResponse.json(rows)
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 })
  }
}

async function ensureOwner(userId: string, providerId: string) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) throw new Error("not-auth")
  const { data: prov } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", providerId)
    .maybeSingle()
  const ownerId = prov?.owner_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle()
  const isAdmin = profile?.role === "admin"
  if (ownerId !== userId && !isAdmin) {
    throw new Error("not-perm")
  }
}

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: ServiceCreatePayload
  try {
    payload = (await req.json()) as ServiceCreatePayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { providerId, name, durationMinutes, priceMyr } = payload
  if (!providerId || !name || !durationMinutes || priceMyr == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  try {
    await ensureOwner(user.id, providerId)
    const created = await serviceService.create({
      provider_id: providerId,
      name,
      duration_minutes: durationMinutes,
      price_myr: priceMyr,
    })
    return NextResponse.json({ ok: true, service: created })
  } catch (err: unknown) {
    if (isNotPermError(err)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    const message = err instanceof Error ? err.message : "Create failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: ServicePatchPayload
  try {
    payload = (await req.json()) as ServicePatchPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { id, updates, providerId } = payload
  if (!id || !updates || !providerId) {
    return NextResponse.json({ error: "Missing id/updates/providerId" }, { status: 400 })
  }
  try {
    await ensureOwner(user.id, providerId)
    const updated = await serviceService.update(id, updates)
    return NextResponse.json({ ok: true, service: updated })
  } catch (err: unknown) {
    if (isNotPermError(err)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    const message = err instanceof Error ? err.message : "Update failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

export async function DELETE(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: ServiceDeletePayload
  try {
    payload = (await req.json()) as ServiceDeletePayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { id, providerId } = payload
  if (!id || !providerId) {
    return NextResponse.json({ error: "Missing id/providerId" }, { status: 400 })
  }
  try {
    await ensureOwner(user.id, providerId)
    await serviceService.delete(id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    if (isNotPermError(err)) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
    const message = err instanceof Error ? err.message : "Delete failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
