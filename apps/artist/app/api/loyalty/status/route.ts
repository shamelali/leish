import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

export async function GET() {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const sql = getSql()
    const [profile] = await sql`
      SELECT points, points_total_earned, points_total_redeemed, loyalty_tier, member_since
      FROM public.profiles WHERE id = ${user.id}
    `

    if (!profile) return NextResponse.json({ status: null })

    const [config] = await sql`SELECT * FROM public.loyalty_config WHERE id = 'default'`
    const tierThresholds = (config?.tier_thresholds as Record<string, number>) || { bronze: 0, silver: 500, gold: 1500, platinum: 3000 }
    const tierBonuses = (config?.tier_bonuses as Record<string, number>) || { bronze: 0, silver: 10, gold: 15, platinum: 20 }

    return NextResponse.json({
      status: {
        points: profile.points,
        pointsTotalEarned: profile.points_total_earned,
        pointsTotalRedeemed: profile.points_total_redeemed,
        tier: profile.loyalty_tier,
        memberSince: profile.member_since,
        tierThresholds,
        currentTierBonus: tierBonuses[profile.loyalty_tier] || 0,
      },
    })
  } catch (error) {
    console.error("[loyalty/status] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
