"use server"

import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function getFavorites(): Promise<string[]> {
  try {
    const supabase = await getSupabaseSsrClient()
    if (!supabase) return []

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from("favorites")
      .select("provider_id")
      .eq("customer_id", user.id)

    if (error || !data) return []

    return data.map(f => f.provider_id)
  } catch (err) {
    console.error("Error fetching favorites:", err)
    return []
  }
}

export async function toggleFavorite(providerId: string): Promise<{ success: boolean; favorited: boolean }> {
  try {
    const supabase = await getSupabaseSsrClient()
    if (!supabase) {
      return { success: false, favorited: false }
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, favorited: false }
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("customer_id", user.id)
      .eq("provider_id", providerId)
      .maybeSingle()

    if (existing) {
      // Remove favorite
      await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id)

      return { success: true, favorited: false }
    } else {
      // Add favorite
      await supabase
        .from("favorites")
        .insert({
          customer_id: user.id,
          provider_id: providerId,
        })

      return { success: true, favorited: true }
    }
  } catch (err) {
    console.error("Error toggling favorite:", err)
    return { success: false, favorited: false }
  }
}
