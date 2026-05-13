import { artists, studios } from "@/lib/data"

export function getProDashboardMock() {
  const artist = artists[0]
  const totalServices = artist.services.length
  const totalReviews = artist.testimonials.length
  const avgRating =
    artist.testimonials.reduce((sum, t) => sum + t.rating, 0) /
    Math.max(artist.testimonials.length, 1)
  const upcomingBookings = Object.entries(artist.bookedSlots).flatMap(([date, slots]) =>
    slots.map((slot) => ({ date, slot, type: "Confirmed", client: "Client", amountMyr: artist.hourlyRate }))
  )

  return {
    provider: artist,
    stats: [
      { label: "Monthly Revenue", value: "MYR 12,800", hint: "+18% vs last month" },
      { label: "Upcoming Bookings", value: String(upcomingBookings.length), hint: "Next 30 days" },
      { label: "Average Rating", value: avgRating.toFixed(1), hint: `${totalReviews} reviews` },
      { label: "Active Services", value: String(totalServices), hint: "Published" },
    ],
    upcomingBookings: upcomingBookings.slice(0, 8),
    reviews: artist.testimonials.map((t) => ({
      author: t.name,
      rating: t.rating,
      text: t.text,
      status: "Published",
    })),
    payouts: [
      { period: "Feb 2026", gross: "MYR 12,800", fees: "MYR 384", net: "MYR 12,416", status: "Scheduled" },
      { period: "Jan 2026", gross: "MYR 10,950", fees: "MYR 329", net: "MYR 10,621", status: "Paid" },
    ],
  }
}

export function getAdminDashboardMock() {
  const totalArtists = artists.length
  const totalStudios = studios.length
  const totalProviders = totalArtists + totalStudios
  const avgArtistRating =
    artists.reduce((sum, a) => sum + a.rating, 0) / Math.max(artists.length, 1)

  return {
    stats: [
      { label: "Total Providers", value: String(totalProviders), hint: `${totalArtists} artists • ${totalStudios} studios` },
      { label: "GMV (MTD)", value: "MYR 84,500", hint: "+12.4% growth" },
      { label: "Bookings (MTD)", value: "214", hint: "31 pending review" },
      { label: "Avg Artist Rating", value: avgArtistRating.toFixed(1), hint: "Marketplace-wide" },
    ],
    pendingApprovals: [
      { type: "Studio Profile", name: "Lotus Bridal Suite", state: "Selangor", submitted: "2026-02-21" },
      { type: "Artist KYC", name: "Nadia Lim", state: "Johor", submitted: "2026-02-21" },
      { type: "Service Update", name: "Maison Leish", state: "Kuala Lumpur", submitted: "2026-02-20" },
    ],
    recentBookings: [
      { id: "BK-2F8A", provider: "Aiko Nakamura", customer: "Nur Aisyah", amount: "MYR 450", status: "Paid" },
      { id: "BK-2F91", provider: "Maison Leish", customer: "Daniel Tan", amount: "MYR 1,500", status: "Pending" },
      { id: "BK-2F97", provider: "Rouge Collective", customer: "Farah Z.", amount: "MYR 650", status: "Paid" },
    ],
    paymentHealth: [
      { gateway: "Billplz", status: "Operational", successRate: "97.9%" },
    ],
    flaggedReviews: [
      { provider: "The Glow Room", author: "Anonymous", reason: "Spam suspicion", status: "Needs review" },
      { provider: "Mei Lin", author: "User #142", reason: "Abusive language", status: "Flagged" },
    ],
  }
}
