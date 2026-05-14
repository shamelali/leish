import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

// simple provider API: public GET, authenticated POST/PATCH
type ProviderCreatePayload = {
  kind?: string
  slug?: string
  display_name?: string
  state?: string
  district?: string
}

type ProviderPatchPayload = {
  id?: string
  updates?: Record<string, unknown>
}

export async function GET() {
  const sql = getSql()
  const rows = await sql`select * from public.providers where is_active = true`
  return NextResponse.json(rows)
}

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: ProviderCreatePayload
  try {
    payload = (await req.json()) as ProviderCreatePayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  // require minimal fields
  const { kind, slug, display_name, state, district } = payload
  if (!kind || !slug || !display_name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }

  try {
    const sql = getSql()
    const [created] = await sql<{ id: string }[]>`
      insert into public.providers (owner_id, kind, slug, display_name, state, district)
      values (${user.id}, ${kind}, ${slug}, ${display_name}, ${state ?? ""}, ${district ?? ""})
      returning id
    `
    return NextResponse.json({ ok: true, providerId: created.id })
  } catch (err) {
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

  let payload: ProviderPatchPayload
  try {
    payload = (await req.json()) as ProviderPatchPayload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }
  const { id, updates } = payload
  if (!id || !updates) return NextResponse.json({ error: "Missing id/updates" }, { status: 400 })

  // check owner or admin
  const { data: prov } = await supabase
    .from("providers")
    .select("owner_id")
    .eq("id", id)
    .maybeSingle()
  const ownerId = prov?.owner_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()
  const isAdmin = profile?.role === "admin"
  if (ownerId !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  }
  try {
    const sql = getSql()
    const allowedKeys = ["slug", "display_name", "state", "district", "is_active"] as const
    const entries = Object.entries(updates).filter(([key]) =>
      allowedKeys.includes(key as (typeof allowedKeys)[number])
    )
    if (entries.length === 0) {
      return NextResponse.json({ error: "No allowed fields to update" }, { status: 400 })
    }

    for (const [key, value] of entries) {
      switch (key) {
        case "slug":
          await sql`update public.providers set slug = ${String(value)} where id = ${id}`
          break
        case "display_name":
          await sql`update public.providers set display_name = ${String(value)} where id = ${id}`
          break
        case "state":
          await sql`update public.providers set state = ${String(value)} where id = ${id}`
          break
        case "district":
          await sql`update public.providers set district = ${String(value)} where id = ${id}`
          break
        case "is_active":
          await sql`update public.providers set is_active = ${Boolean(value)} where id = ${id}`
          break
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
