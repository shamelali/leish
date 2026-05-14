import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function GET(req: NextRequest) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !["admin", "studio_manager"].includes(profile.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const sql = getSql()
  const { searchParams } = new URL(req.url)
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200)
  const offset = parseInt(searchParams.get("offset") || "0")
  const actionFilter = searchParams.get("action")

  let query = sql<{
    id: string
    actor_id: string | null
    action: string
    target: string
    meta: unknown
    created_at: string
  }[]>`
    select id, actor_id, action, target, meta, created_at
    from public.admin_audit_log
  `

  if (actionFilter) {
    query = sql`
      select id, actor_id, action, target, meta, created_at
      from public.admin_audit_log
      where action = ${actionFilter}
      order by created_at desc
      limit ${limit} offset ${offset}
    `
  } else {
    query = sql`
      select id, actor_id, action, target, meta, created_at
      from public.admin_audit_log
      order by created_at desc
      limit ${limit} offset ${offset}
    `
  }

  return NextResponse.json({ logs: query })
}
