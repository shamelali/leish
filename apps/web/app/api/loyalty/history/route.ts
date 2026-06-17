import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { loyaltyService } from "@/lib/services/loyalty"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const history = await loyaltyService.getPointsHistory(user.id)
    return NextResponse.json({ history })
  } catch (error) {
    console.error("[loyalty/history] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
