import type { Artist, Category, Studio } from "./types"
import { artists } from "./artists"
import { studios } from "./studios"

const ALL_TIME_SLOTS = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
]

export function getAvailableSlots(artistId: string, dateKey: string): { slot: string; available: boolean }[] {
  const artist = artists.find((a) => a.id === artistId)
  const booked = artist?.bookedSlots[dateKey] ?? []
  return ALL_TIME_SLOTS.map((slot) => ({
    slot,
    available: !booked.includes(slot),
  }))
}

export function getArtistBySlug(slug: string): Artist | undefined {
  return artists.find((a) => a.slug === slug)
}

export function getArtistsByCategory(category: Category | "All"): Artist[] {
  if (category === "All") return artists
  return artists.filter((a) => a.specialties.includes(category))
}

export function getStudioBySlug(slug: string): Studio | undefined {
  return studios.find((s) => s.slug === slug)
}

export function getStudiosByCategory(category: Category | "All"): Studio[] {
  if (category === "All") return studios
  return studios.filter((s) => s.specialties.includes(category))
}

export function getStudioAvailableSlots(studioId: string, dateKey: string): { slot: string; available: boolean }[] {
  const studio = studios.find((s) => s.id === studioId)
  const booked = studio?.bookedSlots[dateKey] ?? []
  return ALL_TIME_SLOTS.map((slot) => ({
    slot,
    available: !booked.includes(slot),
  }))
}
