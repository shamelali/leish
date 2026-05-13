"use server"

import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Category } from "@/lib/data"

export interface ArtistListItem {
  id: string
  slug: string
  name: string
  image: string
  specialties: Category[]
  location: string
  state: string
  district: string
  rating: number
  reviewCount: number
  hourlyRate: number
  isVerified: boolean
}

export async function getArtists(): Promise<ArtistListItem[]> {
  try {
    const supabase = await getSupabaseSsrClient()
    if (!supabase) {
      console.error("Supabase client not initialized")
      return []
    }

    const { data, error } = await supabase
      .from("providers")
      .select(
        `
        id,
        slug,
        display_name,
        state,
        district,
        hourly_rate,
        specialties,
        rating,
        review_count
      `
      )
      .eq("kind", "artist")
      .eq("is_active", true)
      .order("display_name")

    if (error) {
      console.error("Error fetching artists:", error)
      return []
    }

    if (!data) {
      return []
    }

    return (
      data?.map((artist: Record<string, unknown>) => ({
        id: String(artist.id),
        slug: String(artist.slug),
        name: String(artist.display_name),
        image: "/artists/placeholder.jpg",
        specialties: (artist.specialties || []) as Category[],
        location: `${artist.state}, ${artist.district}`,
        state: String(artist.state),
        district: String(artist.district),
        rating: Number(artist.rating) || 0,
        reviewCount: Number(artist.review_count) || 0,
        hourlyRate: Number(artist.hourly_rate) || 0,
        isVerified: true,
      })) || []
    )
  } catch (err) {
    console.error("Exception fetching artists:", err)
    return []
  }
}

export async function getArtistStates(): Promise<
  { state: string; count: number }[]
> {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("providers")
    .select("state")
    .eq("kind", "artist")
    .eq("is_active", true)

  if (error || !data) {
    return []
  }

  const counts = data.reduce(
    (acc, item) => {
      const state = item.state
      acc[state] = (acc[state] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  return Object.entries(counts)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => a.state.localeCompare(b.state))
}
