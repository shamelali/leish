import { createClient } from "@supabase/supabase-js"

export interface AnalyticsOverview {
  totalRevenue: { value: number; change: number; period: string }
  totalBookings: { value: number; change: number; period: string }
  activeProviders: { value: number; change: number }
  activeCustomers: { value: number; change: number }
  averageOrderValue: { value: number; change: number }
  conversionRate: { value: number; change: number }
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  bookings: number
}

export interface ProviderAnalytics {
  id: string
  name: string
  type: string
  revenue: number
  bookings: number
  avgRating: number
  status: string
}

export interface CustomerSegment {
  segment: string
  count: number
  revenue: number
  percentage: number
}

export interface BookingTrend {
  date: string
  completed: number
  canceled: number
  pending: number
}

export interface TopService {
  name: string
  bookings: number
  revenue: number
}

export interface AnalyticsFilters {
  startDate?: string
  endDate?: string
  providerId?: string
  period?: "day" | "week" | "month"
}

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error("Missing Supabase credentials")
  return createClient(url, key)
}

export async function getAnalyticsOverview(filters?: AnalyticsFilters): Promise<AnalyticsOverview> {
  const supabase = getSupabaseClient()
  
  const period = filters?.period || "month"
  const now = new Date()
  let startDate: Date
  let prevStartDate: Date
  let prevEndDate: Date

  switch (period) {
    case "day":
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - 1)
      prevEndDate = new Date(startDate)
      break
    case "week":
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      prevStartDate = new Date(startDate)
      prevStartDate.setDate(prevStartDate.getDate() - 7)
      prevEndDate = new Date(startDate)
      break
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      prevEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
  }

  // Current period stats
  const [revenueResult, bookingsResult, providersResult, customersResult] = await Promise.all([
    supabase.from("bookings")
      .select("total_amount_myr")
      .in("status", ["paid_deposit", "paid_full", "completed"])
      .gte("created_at", startDate.toISOString()),
    supabase.from("bookings")
      .select("id")
      .gte("created_at", startDate.toISOString()),
    supabase.from("providers")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),
  ])

  // Previous period stats
  const [prevRevenueResult, prevBookingsResult] = await Promise.all([
    supabase.from("bookings")
      .select("total_amount_myr")
      .in("status", ["paid_deposit", "paid_full", "completed"])
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", prevEndDate.toISOString()),
    supabase.from("bookings")
      .select("id")
      .gte("created_at", prevStartDate.toISOString())
      .lt("created_at", prevEndDate.toISOString()),
  ])

  const currentRevenue = (revenueResult.data || []).reduce((sum, b) => sum + (b.total_amount_myr || 0), 0)
  const prevRevenue = (prevRevenueResult.data || []).reduce((sum, b) => sum + (b.total_amount_myr || 0), 0)
  
  const currentBookings = (bookingsResult.data || []).length
  const prevBookings = (prevBookingsResult.data || []).length

  const avgOrderValue = currentBookings > 0 ? currentRevenue / currentBookings : 0

  return {
    totalRevenue: {
      value: currentRevenue,
      change: prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0,
      period: period === "day" ? "vs yesterday" : period === "week" ? "vs last 7 days" : "vs last month",
    },
    totalBookings: {
      value: currentBookings,
      change: prevBookings > 0 ? ((currentBookings - prevBookings) / prevBookings) * 100 : 0,
      period: period === "day" ? "vs yesterday" : period === "week" ? "vs last 7 days" : "vs last month",
    },
    activeProviders: {
      value: providersResult.count || 0,
      change: 0,
    },
    activeCustomers: {
      value: customersResult.count || 0,
      change: 0,
    },
    averageOrderValue: {
      value: avgOrderValue,
      change: 0,
    },
    conversionRate: {
      value: 0,
      change: 0,
    },
  }
}

export async function getRevenueTimeSeries(filters?: AnalyticsFilters): Promise<RevenueDataPoint[]> {
  const supabase = getSupabaseClient()
  const period = filters?.period || "week"
  
  const days = period === "day" ? 1 : period === "week" ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from("bookings")
    .select("created_at, total_amount_myr")
    .in("status", ["paid_deposit", "paid_full", "completed"])
    .gte("created_at", startDate.toISOString())
    .order("created_at", { ascending: true })

  const grouped: Record<string, { revenue: number; bookings: number }> = {}
  
  for (const booking of data || []) {
    const dateKey = new Date(booking.created_at).toISOString().split("T")[0]
    if (!grouped[dateKey]) {
      grouped[dateKey] = { revenue: 0, bookings: 0 }
    }
    grouped[dateKey].revenue += booking.total_amount_myr || 0
    grouped[dateKey].bookings++
  }

  return Object.entries(grouped).map(([date, vals]) => ({
    date,
    revenue: vals.revenue,
    bookings: vals.bookings,
  }))
}

export async function getTopProviders(limit = 10): Promise<ProviderAnalytics[]> {
  const supabase = getSupabaseClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from("bookings")
    .select("provider_id, total_amount_myr")
    .in("status", ["paid_deposit", "paid_full", "completed"])
    .gte("created_at", thirtyDaysAgo.toISOString())

  const providerStats: Record<string, { revenue: number; bookings: number }> = {}
  
  for (const booking of data || []) {
    if (!providerStats[booking.provider_id]) {
      providerStats[booking.provider_id] = { revenue: 0, bookings: 0 }
    }
    providerStats[booking.provider_id].revenue += booking.total_amount_myr || 0
    providerStats[booking.provider_id].bookings++
  }

  const sortedProviders = Object.entries(providerStats)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, limit)

  const providers = await Promise.all(
    sortedProviders.map(async ([id, stats]) => {
      const { data: provider } = await supabase
        .from("providers")
        .select("display_name, kind, is_active")
        .eq("id", id)
        .single()

      return {
        id,
        name: provider?.display_name || "Unknown",
        type: provider?.kind || "artist",
        revenue: stats.revenue,
        bookings: stats.bookings,
        avgRating: 0,
        status: provider?.is_active ? "active" : "inactive",
      }
    })
  )

  return providers
}

export async function getCustomerSegments(): Promise<CustomerSegment[]> {
  const supabase = getSupabaseClient()
  
  const { data: bookings } = await supabase
    .from("bookings")
    .select("customer_id, total_amount_myr")
    .in("status", ["paid_deposit", "paid_full", "completed"])

  const customerStats: Record<string, { revenue: number; bookings: number }> = {}
  
  for (const booking of bookings || []) {
    if (!customerStats[booking.customer_id]) {
      customerStats[booking.customer_id] = { revenue: 0, bookings: 0 }
    }
    customerStats[booking.customer_id].revenue += booking.total_amount_myr || 0
    customerStats[booking.customer_id].bookings++
  }

  const totalCustomers = Object.keys(customerStats).length

  const segments = [
    { segment: "New (< 3 bookings)", count: 0, revenue: 0 },
    { segment: "Regular (3-10 bookings)", count: 0, revenue: 0 },
    { segment: "Loyal (10+ bookings)", count: 0, revenue: 0 },
  ]

  for (const [, stats] of Object.entries(customerStats)) {
    if (stats.bookings < 3) {
      segments[0].count++
      segments[0].revenue += stats.revenue
    } else if (stats.bookings <= 10) {
      segments[1].count++
      segments[1].revenue += stats.revenue
    } else {
      segments[2].count++
      segments[2].revenue += stats.revenue
    }
  }

  return segments.map((s) => ({
    ...s,
    percentage: totalCustomers > 0 ? (s.count / totalCustomers) * 100 : 0,
  }))
}

export async function getBookingTrends(filters?: AnalyticsFilters): Promise<BookingTrend[]> {
  const supabase = getSupabaseClient()
  const period = filters?.period || "week"
  
  const days = period === "day" ? 1 : period === "week" ? 7 : 30
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const { data } = await supabase
    .from("bookings")
    .select("created_at, status")
    .gte("created_at", startDate.toISOString())

  const grouped: Record<string, { completed: number; canceled: number; pending: number }> = {}
  
  for (const booking of data || []) {
    const dateKey = new Date(booking.created_at).toISOString().split("T")[0]
    if (!grouped[dateKey]) {
      grouped[dateKey] = { completed: 0, canceled: 0, pending: 0 }
    }
    if (["completed", "paid_deposit", "paid_full"].includes(booking.status)) {
      grouped[dateKey].completed++
    } else if (booking.status === "canceled") {
      grouped[dateKey].canceled++
    } else {
      grouped[dateKey].pending++
    }
  }

  return Object.entries(grouped).map(([date, vals]) => ({
    date,
    ...vals,
  }))
}

export async function getTopServices(limit = 5): Promise<TopService[]> {
  const supabase = getSupabaseClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data } = await supabase
    .from("bookings")
    .select("service_id, total_amount_myr")
    .in("status", ["paid_deposit", "paid_full", "completed"])
    .gte("created_at", thirtyDaysAgo.toISOString())

  const serviceStats: Record<string, { revenue: number; bookings: number }> = {}
  
  for (const booking of data || []) {
    if (!serviceStats[booking.service_id]) {
      serviceStats[booking.service_id] = { revenue: 0, bookings: 0 }
    }
    serviceStats[booking.service_id].revenue += booking.total_amount_myr || 0
    serviceStats[booking.service_id].bookings++
  }

  const sorted = Object.entries(serviceStats)
    .sort((a, b) => b[1].bookings - a[1].bookings)
    .slice(0, limit)

  const services = await Promise.all(
    sorted.map(async ([id, stats]) => {
      const { data: service } = await supabase
        .from("services")
        .select("name")
        .eq("id", id)
        .single()

      return {
        name: service?.name || "Unknown Service",
        bookings: stats.bookings,
        revenue: stats.revenue,
      }
    })
  )

  return services
}

export async function getUserBehaviorMetrics() {
  const supabase = getSupabaseClient()
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Search/engagement metrics
  const { count: searchCount } = await supabase
    .from("search_logs")
    .select("id", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Profile views
  const { count: profileViews } = await supabase
    .from("profile_views")
    .select("id", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString())

  // Favorites
  const { count: favoritesCount } = await supabase
    .from("favorites")
    .select("id", { count: "exact", head: true })

  // Bookings
  const { count: bookingsCount } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .gte("created_at", thirtyDaysAgo.toISOString())

  return {
    searchesLast30Days: searchCount || 0,
    profileViewsLast30Days: profileViews || 0,
    totalFavorites: favoritesCount || 0,
    bookingsLast30Days: bookingsCount || 0,
    searchToBookingRate: searchCount && bookingsCount 
      ? ((bookingsCount / searchCount) * 100).toFixed(1) 
      : "0",
  }
}