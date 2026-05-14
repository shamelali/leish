// Re-export from dashboard-simple to avoid breaking changes
export { getAdminDashboardData } from "./dashboard-simple"
export type { AdminDashboardData } from "./dashboard-simple"

// Pro dashboard data - simplified version
export interface ProDashboardData {
  provider: {
    name: string
    location: string
    hourlyRate: number
    specialties: string[]
  }
  stats: { label: string; value: string; hint: string }[]
  upcomingBookings: {
    id: string
    date: string
    slot: string
    client: string
    type: string
    amountMyr: number
    status: string
  }[]
  reviews: { id: string; author: string; status: string; rating: number; text: string; createdAt: string }[]
  payouts: { period: string; status: string; gross: string; fees: string; net: string }[]
}

// Simplified pro dashboard that returns mock data
export async function getProDashboardData(): Promise<ProDashboardData> {
  return {
    provider: {
      name: "Your Studio",
      location: "Kuala Lumpur",
      hourlyRate: 150,
      specialties: ["Bridal", "Editorial"],
    },
    stats: [
      { label: "Bookings", value: "12", hint: "This month" },
      { label: "Revenue", value: "MYR 3,600", hint: "This month" },
      { label: "Rating", value: "4.9", hint: "Average" },
    ],
    upcomingBookings: [],
    reviews: [],
    payouts: [],
  }
}
