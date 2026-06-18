import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  let payload: { id?: string; updates?: Record<string, unknown> }
  try { payload = await req.json() } catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }) }

  const { id, updates } = payload
  if (!id || !updates) return NextResponse.json({ error: "Missing id/updates" }, { status: 400 })

  const { data: prov } = await supabase.from("providers").select("owner_id").eq("id", id).maybeSingle()
  const ownerId = prov?.owner_id
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  const isAdmin = profile?.role === "admin"
  if (ownerId !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 })
  }

  try {
    const sql = getSql()
    const allowedKeys = ["slug", "display_name", "state", "district", "is_active", "bio", "experience", "hourly_rate", "specialties"]
    const entries = Object.entries(updates).filter(([key]) => allowedKeys.includes(key))
    if (entries.length === 0) {
      return NextResponse.json({ error: "No allowed fields to update" }, { status: 400 })
    }

    for (const [key, value] of entries) {
      if (key === "slug") await sql`update public.providers set slug = ${String(value)} where id = ${id}`
      else if (key === "display_name") await sql`update public.providers set display_name = ${String(value)} where id = ${id}`
      else if (key === "state") await sql`update public.providers set state = ${String(value)} where id = ${id}`
      else if (key === "district") await sql`update public.providers set district = ${String(value)} where id = ${id}`
      else if (key === "is_active") await sql`update public.providers set is_active = ${Boolean(value)} where id = ${id}`
      else if (key === "bio") await sql`update public.providers set bio = ${String(value)} where id = ${id}`
      else if (key === "experience") await sql`update public.providers set experience = ${String(value)} where id = ${id}`
      else if (key === "hourly_rate") await sql`update public.providers set hourly_rate = ${Number(value)} where id = ${id}`
      else if (key === "specialties") await sql`update public.providers set specialties = ${value as string[]} where id = ${id}`
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
