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

    const status = await loyaltyService.getUserStatus(user.id)
    if (!status) {
      return NextResponse.json({ status: null })
    }

    return NextResponse.json({ status })
  } catch (error) {
    console.error("[loyalty/status] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
