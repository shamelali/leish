import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

export async function GET() {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sql = getSql()
    const history = await sql`
      SELECT * FROM public.loyalty_points_history
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
      LIMIT 20
    `

    return NextResponse.json({ history })
  } catch (error) {
    console.error("[loyalty/history] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
