import { getSupabaseServerClient } from "@/lib/supabase/server"

export interface StudioRoom {
  id: string
  studio_id: string
  name: string
  description: string | null
  capacity: string | null
  price_per_hour: number
  is_active: boolean
  sort_order: number
}

export interface StudioRoomInput {
  name: string
  description?: string | null
  capacity?: string | null
  price_per_hour: number
  sort_order?: number
}

export const studioRoomService = {
  async listByStudio(studioId: string): Promise<StudioRoom[]> {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from("studio_rooms")
      .select("*")
      .eq("studio_id", studioId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true })
    return (data as StudioRoom[]) || []
  },

  async getById(id: string): Promise<StudioRoom | null> {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from("studio_rooms")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    return (data as StudioRoom) || null
  },

  async create(studioId: string, input: StudioRoomInput): Promise<StudioRoom> {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("studio_rooms")
      .insert({
        studio_id: studioId,
        name: input.name,
        description: input.description || null,
        capacity: input.capacity || null,
        price_per_hour: input.price_per_hour,
        sort_order: input.sort_order ?? 0,
        is_active: true,
      })
      .select()
      .maybeSingle()

    if (error) throw new Error(error.message)
    return data as StudioRoom
  },

  async update(id: string, input: Partial<StudioRoomInput & { is_active?: boolean }>): Promise<void> {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from("studio_rooms")
      .update(input)
      .eq("id", id)

    if (error) throw new Error(error.message)
  },

  async delete(id: string): Promise<void> {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from("studio_rooms")
      .delete()
      .eq("id", id)

    if (error) throw new Error(error.message)
  },

  async reorder(ids: string[]): Promise<void> {
    const supabase = getSupabaseServerClient()
    const updates = ids.map((id, index) => ({
      id,
      sort_order: index,
    }))

    const { error } = await supabase
      .from("studio_rooms")
      .upsert(updates)

    if (error) throw new Error(error.message)
  },
}
