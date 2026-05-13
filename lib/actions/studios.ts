"use server"

import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import type { Category } from "@/lib/data"

export interface StudioListItem {
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
  startingPrice: number
  teamSize: number
  isVerified: boolean
  bio?: string
  amenities?: string[]
  services?: { name: string; duration: string; price: number }[]
  portfolio?: { type: string; src: string; alt: string }[]
  testimonials?: { name: string; text: string; rating: number }[]
  artists?: { name: string; role: string; image: string }[]
}

export async function getStudios(): Promise<StudioListItem[]> {
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
      .eq("kind", "studio")
      .eq("is_active", true)
      .order("display_name")

    if (error) {
      console.error("Error fetching studios:", error)
      return []
    }

    if (!data) {
      return []
    }

    return (
      data?.map((studio: Record<string, unknown>) => ({
        id: String(studio.id),
        slug: String(studio.slug),
        name: String(studio.display_name),
        image: "/studios/placeholder.jpg",
        specialties: (studio.specialties || []) as Category[],
        location: `${studio.state}, ${studio.district}`,
        state: String(studio.state),
        district: String(studio.district),
        rating: Number(studio.rating) || 0,
        reviewCount: Number(studio.review_count) || 0,
        startingPrice: Number(studio.hourly_rate) || 0,
        teamSize: 5,
        isVerified: true,
      })) || []
    )
  } catch (err) {
    console.error("Exception fetching studios:", err)
    return []
  }
}

export async function getStudioStates(): Promise<string[]> {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return []

  const { data, error } = await supabase
    .from("providers")
    .select("state")
    .eq("kind", "studio")
    .eq("is_active", true)

  if (error || !data) {
    return []
  }

  const states = Array.from(new Set(data.map((item) => item.state)))
  return states.sort()
}

export async function getStudioBySlug(
  slug: string
): Promise<StudioListItem | null> {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("providers")
    .select(
      `
      id,
      slug,
      display_name,
      state,
      district,
      starting_price,
      specialties,
      rating,
      review_count,
      team_size,
      is_verified,
      bio
    `
    )
    .eq("slug", slug)
    .eq("kind", "studio")
    .eq("is_active", true)
    .single()

  if (error || !data) {
    console.error("Error fetching studio:", error)
    return null
  }

  return {
    id: data.id,
    slug: data.slug,
    name: data.display_name,
    image: "/studios/placeholder.jpg",
    specialties: (data.specialties || []) as Category[],
    location: `${data.state}, ${data.district}`,
    state: data.state,
    district: data.district,
    rating: data.rating || 0,
    reviewCount: data.review_count || 0,
    startingPrice: data.starting_price || 0,
    teamSize: data.team_size || 0,
    isVerified: data.is_verified || false,
  }
}
