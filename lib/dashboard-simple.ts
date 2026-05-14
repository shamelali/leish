import { createClient } from "@supabase/supabase-js"

// Simple dashboard data that works without DATABASE_URL
// Uses Supabase client instead of direct postgres

export interface AdminDashboardData {
  stats: { label: string; value: string; hint: string }[]
  pendingApprovals: { type: string; name: string; state: string; submitted: string }[]
  recentBookings: { id: string; status: string; provider: string; customer: string; amount: string }[]
  paymentHealth: { gateway: string; status: string; successRate: string }[]
  flaggedReviews: { id: string; provider: string; author: string; reason: string; status: string }[]
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    
    if (!url || !key) {
      throw new Error("Missing Supabase credentials")
    }
    
    const supabase = createClient(url, key)

    // Get counts
    const { count: totalProviders } = await supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true)

    const { count: totalArtists } = await supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("kind", "artist")
      .eq("is_active", true)

    const { count: totalStudios } = await supabase
      .from("providers")
      .select("*", { count: "exact", head: true })
      .eq("kind", "studio")
      .eq("is_active", true)

    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })

    // Get pending approvals
    const { data: pendingRows } = await supabase
      .from("providers")
      .select("kind, display_name, state, created_at")
      .eq("is_active", false)
      .order("created_at", { ascending: false })
      .limit(20)

    const pendingApprovals = (pendingRows || []).map((r: Record<string, unknown>) => ({
      type: r.kind === "artist" ? "Artist" : "Studio",
      name: String(r.display_name ?? "Unnamed"),
      state: String(r.state ?? "—"),
      submitted: new Date(String(r.created_at)).toLocaleDateString(),
    }))

    // Get recent bookings
    const { data: bookingRows } = await supabase
      .from("bookings")
      .select("id, status, provider_id, customer_id, total_amount_myr, created_at")
      .order("created_at", { ascending: false })
      .limit(20)

    // Fetch provider and customer names separately
    const recentBookings = await Promise.all(
      (bookingRows || []).map(async (b: Record<string, unknown>) => {
        const [{ data: provider }, { data: customer }] = await Promise.all([
          supabase.from("providers").select("display_name").eq("id", String(b.provider_id)).maybeSingle(),
          supabase.from("profiles").select("email").eq("id", String(b.customer_id)).maybeSingle(),
        ])
        return {
          id: String(b.id).slice(0, 8),
          status: String(b.status ?? "unknown"),
          provider: provider?.display_name ?? "—",
          customer: customer?.email ?? "—",
          amount: b.total_amount_myr ? `MYR ${b.total_amount_myr}` : "—",
        }
      })
    )

    // Get payment health
    const { data: paymentRows } = await supabase
      .from("payments")
      .select("gateway, status")

    const paymentStats = (paymentRows || []).reduce((acc: Record<string, {total: number; paid: number}>, p: Record<string, unknown>) => {
      const gateway = String(p.gateway)
      if (!acc[gateway]) {
        acc[gateway] = { total: 0, paid: 0 }
      }
      acc[gateway].total++
      if (["paid", "paid_full", "paid_deposit"].includes(String(p.status))) {
        acc[gateway].paid++
      }
      return acc
    }, {})

    const paymentHealth = Object.entries(paymentStats).map(([gateway, stats]: [string, {total: number; paid: number}]) => ({
      gateway,
      status: stats.paid > 0 ? "Operational" : "No paid transactions",
      successRate: stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : "n/a",
    }))

    // Get flagged reviews
    const { data: reviewRows } = await supabase
      .from("reviews")
      .select("id, provider_id, reviewer_id, flag_reason, status")
      .eq("status", "flagged")
      .order("created_at", { ascending: false })
      .limit(20)

    const flaggedReviews = await Promise.all(
      (reviewRows || []).map(async (r: Record<string, unknown>) => {
        const [{ data: provider }, { data: reviewer }] = await Promise.all([
          supabase.from("providers").select("display_name").eq("id", String(r.provider_id)).maybeSingle(),
          supabase.from("profiles").select("email").eq("id", String(r.reviewer_id)).maybeSingle(),
        ])
        return {
          id: String(r.id),
          provider: provider?.display_name ?? "—",
          author: reviewer?.email ?? "—",
          reason: String(r.flag_reason ?? "Reported by user"),
          status: String(r.status ?? "flagged"),
        }
      })
    )

    return {
      stats: [
        { label: "Total Providers", value: String(totalProviders ?? 0), hint: `${totalArtists ?? 0} artists • ${totalStudios ?? 0} studios` },
        { label: "GMV (MTD)", value: "MYR 0", hint: "" },
        { label: "Bookings (MTD)", value: String(totalBookings ?? 0), hint: "All time" },
        { label: "Avg Provider Rating", value: "0.0", hint: "Marketplace-wide" },
      ],
      pendingApprovals,
      recentBookings,
      paymentHealth,
      flaggedReviews,
    }
  } catch (error) {
    console.error("[getAdminDashboardData] Error:", error)
    // Return empty data on error
    return {
      stats: [
        { label: "Total Providers", value: "0", hint: "0 artists • 0 studios" },
        { label: "GMV (MTD)", value: "MYR 0", hint: "" },
        { label: "Bookings (MTD)", value: "0", hint: "All time" },
        { label: "Avg Provider Rating", value: "0.0", hint: "Marketplace-wide" },
      ],
      pendingApprovals: [],
      recentBookings: [],
      paymentHealth: [],
      flaggedReviews: [],
    }
  }
}
