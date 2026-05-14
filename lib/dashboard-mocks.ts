import { artists, studios } from "@/lib/data"

export function getProDashboardMock() {
  const artist = artists[0]
  const totalServices = artist?.services?.length ?? 0
  const totalReviews = artist?.testimonials?.length ?? 0
  const avgRating = artist
    ? artist.testimonials.reduce((sum, t) => sum + t.rating, 0) / Math.max(artist.testimonials.length, 1)
    : 0
  const upcomingBookings = artist
    ? Object.entries(artist.bookedSlots).flatMap(([date, slots]) =>
        slots.map((slot) => ({ date, slot, type: "Confirmed" as const, client: "Client", amountMyr: artist.hourlyRate }))
      )
    : []

  return {
    provider: artist ?? null,
    stats: [
      { label: "Monthly Revenue", value: "MYR 0", hint: "No data yet" },
      { label: "Upcoming Bookings", value: String(upcomingBookings.length), hint: "Next 30 days" },
      { label: "Average Rating", value: avgRating.toFixed(1), hint: `${totalReviews} reviews` },
      { label: "Active Services", value: String(totalServices), hint: "Published" },
    ],
    upcomingBookings: upcomingBookings.slice(0, 8),
    reviews: artist
      ? artist.testimonials.map((t) => ({
          author: t.name,
          rating: t.rating,
          text: t.text,
          status: "Published" as const,
        }))
      : [],
    payouts: [
      { period: "Feb 2026", gross: "MYR 0", fees: "MYR 0", net: "MYR 0", status: "Scheduled" as const },
    ],
  }
}

export function getAdminDashboardMock() {
  const totalArtists = artists.length
  const totalStudios = studios.length
  const totalProviders = totalArtists + totalStudios
  const avgArtistRating =
    artists.length > 0
      ? artists.reduce((sum, a) => sum + a.rating, 0) / artists.length
      : 0

  return {
    stats: [
      { label: "Total Providers", value: String(totalProviders), hint: `${totalArtists} artists • ${totalStudios} studios` },
      { label: "GMV (MTD)", value: "MYR 0", hint: "No data" },
      { label: "Bookings (MTD)", value: "0", hint: "No bookings yet" },
      { label: "Avg Artist Rating", value: avgArtistRating.toFixed(1), hint: "Marketplace-wide" },
    ],
    pendingApprovals: [],
    recentBookings: [],
    paymentHealth: [
      { gateway: "Billplz", status: "Operational" as const, successRate: "N/A" },
    ],
    flaggedReviews: [],
  }
}
