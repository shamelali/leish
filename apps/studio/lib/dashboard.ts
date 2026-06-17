export interface StudioDashboardData {
  provider: { name: string; location: string; hourlyRate: number; specialties: string[] }
  stats: { label: string; value: string; hint: string }[]
  upcomingBookings: { id: string; date: string; slot: string; client: string; type: string; amountMyr: number; status: string }[]
  reviews: { id: string; author: string; status: string; rating: number; text: string; createdAt: string }[]
  payouts: { period: string; status: string; gross: string; fees: string; net: string }[]
}

function getOrdinalSuffix(day: number): string {
  if (day > 3 && day < 21) return "th"
  switch (day % 10) { case 1: return "st"; case 2: return "nd"; case 3: return "rd"; default: return "th" }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate()
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
  return `${months[d.getMonth()]} ${day}${getOrdinalSuffix(day)}`
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes().toString().padStart(2, "0")
  const ampm = h >= 12 ? "pm" : "am"
  return `${h % 12 || 12}:${m}${ampm}`
}

export async function getStudioDashboardData(providerId?: string): Promise<StudioDashboardData> {
  if (!providerId) {
    return { provider: { name: "", location: "", hourlyRate: 0, specialties: [] }, stats: [], upcomingBookings: [], reviews: [], payouts: [] }
  }
  const { createClient } = await import("@supabase/supabase-js")
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const [providerRes, bookingsRes, reviewsRes] = await Promise.all([
    supabase.from("providers").select("display_name, state, district, hourly_rate, specialties, starting_price").eq("id", providerId).maybeSingle(),
    supabase.from("bookings").select("id, created_at, status, total_amount_myr, services(name), customer_id").eq("provider_id", providerId).order("created_at", { ascending: false }).limit(10),
    supabase.from("reviews").select("id, rating, body, status, created_at, author_id").eq("provider_id", providerId).order("created_at", { ascending: false }).limit(5),
  ])
  const payoutsRes = await supabase.rpc("get_provider_payout_summary", { p_provider_id: providerId, p_start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0], p_end_date: new Date().toISOString().split("T")[0] })

  const providerRow = providerRes.data as { display_name?: string; state?: string; district?: string | null; hourly_rate?: number | null; starting_price?: number | null; specialties?: string[] | null } | null
  let provLocation = ""
  if (providerRow) {
    provLocation = providerRow.district ? providerRow.state + ", " + providerRow.district : providerRow.state || ""
  }
  const bookings = bookingsRes.data || []
  const reviews = reviewsRes.data || []
  const payouts = payoutsRes?.data && Array.isArray(payoutsRes.data) ? payoutsRes.data : []

  const totalRevenue = bookings.filter((b: any) => !["canceled", "refunded"].includes(b.status)).reduce((sum: number, b: any) => sum + (b.total_amount_myr || 0), 0)
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : "—"
  const pendingCount = bookings.filter((b: any) => b.status === "pending" || b.status === "payment_required").length

  return {
    provider: { name: providerRow?.display_name || "", location: provLocation, hourlyRate: providerRow?.hourly_rate || providerRow?.starting_price || 0, specialties: providerRow?.specialties || [] },
    stats: [
      { label: "Bookings", value: String(bookings.length), hint: "Total" },
      { label: "Revenue", value: `MYR ${totalRevenue.toLocaleString()}`, hint: "All time" },
      { label: "Rating", value: avgRating, hint: `From ${reviews.length} reviews` },
      { label: "Pending", value: String(pendingCount), hint: "Need confirmation" },
    ],
    upcomingBookings: bookings.filter((b: any) => !["completed","canceled","refunded"].includes(b.status)).map((b: any) => ({ id: b.id, date: formatDate(b.created_at), slot: formatTime(b.created_at), client: b.customer_id?.slice(0, 8) || "Unknown", type: b.services?.[0]?.name || "Booking", amountMyr: b.total_amount_myr, status: b.status })),
    reviews: reviews.map((r: any) => ({ id: r.id, author: r.author_id?.slice(0, 8) || "Anonymous", status: r.status, rating: r.rating, text: r.body, createdAt: r.created_at })),
    payouts: payouts.map((p: any) => ({ period: "This month", status: "pending", gross: `MYR ${(p.gross_revenue || 0).toLocaleString()}`, fees: `MYR ${(p.platform_fees || 0).toLocaleString()}`, net: `MYR ${(p.net_payout || 0).toLocaleString()}` })),
  }
}