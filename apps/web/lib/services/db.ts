import type { Artist, Studio } from "@/lib/data"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function getUser() {
  const supabase = await getSupabaseSsrClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    return null
  }

  return data.user
}

// helper types representing database rows
export interface Provider {
  id: string
  owner_id: string
  kind: "artist" | "studio"
  slug: string
  display_name: string
  state: string
  district: string
  is_active: boolean
}

export interface Service {
  id: string
  provider_id: string
  name: string
  duration_minutes: number
  price_myr: number
  is_active: boolean
}

export interface AvailabilitySlot {
  id: string
  provider_id: string
  starts_at: string
  ends_at: string
  is_booked: boolean
}

export interface Booking {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  slot_id: string
  status: string
  notes: string | null
  total_amount_myr: number
  paid_amount_myr: number
}

// validate allowed status transitions
export function validateBookingTransition(current: string, next: string) {
  const allowed: Record<string, string[]> = {
    pending: ["payment_required", "canceled"],
    payment_required: ["confirmed", "canceled"],
    confirmed: ["paid_deposit", "paid_full", "completed", "canceled"],
    paid_deposit: ["completed", "canceled"],
    paid_full: ["completed", "refunded"],
    completed: [],
    canceled: [],
    refunded: [],
  }
  if (current === next) return true
  if (!allowed[current] || !allowed[current].includes(next)) {
    throw new Error(`invalid transition ${current} -> ${next}`)
  }
  return true
}

// Artist/studio listing services backed by the DB
export const dbArtistService = {
  async list() {
    const sql = getSql()
    const rows = await sql<Artist[]>`
      select a.*
      from public.providers p
      join lateral (
        select
          p.id,
          p.slug,
          p.display_name as name,
          p.state as location,
          0 as rating,
          0 as review_count,
          0 as hourly_rate,
          ''::text as image,
          ''::text as bio,
          ''::text as experience,
          '[]'::jsonb as specialties,
          '[]'::jsonb as portfolio,
          '[]'::jsonb as services,
          '[]'::jsonb as testimonials,
          '{}'::jsonb as booked_slots
      ) a on p.id = a.id
      where p.kind = 'artist' and p.is_active = true
    `
    return rows
  },
  async listByCategory() {
    return this.list()
  },
  async getBySlug(slug: string) {
    const sql = getSql()
    const rows = await sql<Artist[]>`
      select * from public.providers where slug = ${slug} and kind = 'artist' limit 1
    `
    return rows[0]
  },
}

export const dbStudioService = {
  async list() {
    const sql = getSql()
    const rows = await sql<Studio[]>`
      select * from public.providers where kind = 'studio' and is_active = true
    `
    return rows
  },
  async listByCategory() {
    return this.list()
  },
  async getBySlug(slug: string) {
    const sql = getSql()
    const rows = await sql<Studio[]>`
      select * from public.providers where slug = ${slug} and kind = 'studio' limit 1
    `
    return rows[0]
  },
}

export const dbBookingAvailabilityService = {
  async getArtistAvailableSlots(artistId: string, dateKey: string) {
    const sql = getSql()
    const rows = await sql<{ slot: string; available: boolean }[]>`
      select id as slot, not is_booked as available
      from public.availability_slots
      where provider_id = ${artistId}
        and date_trunc('day', starts_at) = ${dateKey}
    `
    return rows
  },
  async getStudioAvailableSlots(studioId: string, dateKey: string) {
    const sql = getSql()
    const rows = await sql<{ slot: string; available: boolean }[]>`
      select id as slot, not is_booked as available
      from public.availability_slots
      where provider_id = ${studioId}
        and date_trunc('day', starts_at) = ${dateKey}
    `
    return rows
  },
  async getProviderSlots(providerId: string) {
    const sql = getSql()
    const rows = await sql<AvailabilitySlot[]>`
      select *
      from public.availability_slots
      where provider_id = ${providerId}
      order by starts_at
    `
    return rows
  },
}

export const serviceService = {
  async listByProvider(providerId: string) {
    const sql = getSql()
    const rows = await sql<Service[]>`
      select * from public.services where provider_id = ${providerId} and is_active = true
    `
    return rows
  },
  async create(input: {
    provider_id: string
    name: string
    duration_minutes: number
    price_myr: number
  }) {
    const sql = getSql()
    const rows = await sql<{ id: string }[]>`
      insert into public.services (provider_id, name, duration_minutes, price_myr)
      values (${input.provider_id}, ${input.name}, ${input.duration_minutes}, ${input.price_myr})
      returning id
    `
    const row = rows[0]
    return row as Service
  },
  async update(id: string, updates: Partial<Service>) {
    const sql = getSql()
    const allowedKeys = ["name", "duration_minutes", "price_myr", "is_active"] as const
    const entries = Object.entries(updates).filter(([key]) =>
      allowedKeys.includes(key as (typeof allowedKeys)[number])
    )
    if (entries.length === 0) {
      throw new Error("No allowed fields to update")
    }

    for (const [key, value] of entries) {
      switch (key) {
        case "name":
          await sql`update public.services set name = ${String(value)} where id = ${id}`
          break
        case "duration_minutes":
          await sql`update public.services set duration_minutes = ${Number(value)} where id = ${id}`
          break
        case "price_myr":
          await sql`update public.services set price_myr = ${Number(value)} where id = ${id}`
          break
        case "is_active":
          await sql`update public.services set is_active = ${Boolean(value)} where id = ${id}`
          break
      }
    }
  },
  async delete(id: string) {
    const sql = getSql()
    await sql`
      delete from public.services where id = ${id}
    `
  },
}


