import type { Artist, Studio } from "@/lib/data"
import { getSql, withTransaction } from "@/lib/db/postgres"
import { sendEmail } from "@/lib/email/brevo"
import { bookingConfirmationTemplate } from "@/lib/email/templates"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function getUser() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return null
  }

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
    confirmed: ["paid_deposit", "paid_full", "canceled"],
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

export const bookingService = {
  async create(payload: {
    customerId: string
    providerId: string
    serviceId: string
    slotId: string
    notes?: string
    totalAmountMyr: number
  }) {
    return withTransaction(async (tx) => {
      const slotRows = await tx<{ is_booked: boolean; starts_at: string }[]>`
        select is_booked, starts_at
        from public.availability_slots
        where id = ${payload.slotId}
        for update
      `
      if (slotRows.length === 0) {
        throw new Error("Slot not found")
      }
      const startsAtMs = new Date(slotRows[0].starts_at).getTime()
      const minLeadMs = Date.now() + 24 * 60 * 60 * 1000
      if (startsAtMs < minLeadMs) {
        throw new Error("Bookings must be made at least 24 hours in advance")
      }
      if (slotRows[0].is_booked) {
        throw new Error("Slot is already booked")
      }
      const created = await tx<{ id: string }[]>`
        insert into public.bookings (
          customer_id, provider_id, service_id, slot_id, status, notes, total_amount_myr, paid_amount_myr
        ) values (
          ${payload.customerId},
          ${payload.providerId},
          ${payload.serviceId},
          ${payload.slotId},
          'payment_required',
          ${payload.notes ?? null},
          ${payload.totalAmountMyr},
          0
        ) returning id
      `
      await tx`
        update public.availability_slots
        set is_booked = true
        where id = ${payload.slotId}
      `
      await tx`
        insert into public.booking_events (booking_id, event_type, event_payload)
        values (${created[0].id}, 'booking_created', ${JSON.stringify(payload)}::jsonb)
      `
      return created[0]
    })
  },
  async transition(
    bookingId: string,
    nextStatus: string,
    options?: { paidAmount?: number; slotId?: string }
  ) {
    return withTransaction(async (tx) => {
      const rows = await tx<Booking[]>`
        select * from public.bookings where id = ${bookingId} for update
      `
      if (rows.length === 0) throw new Error("Booking not found")
      const current = rows[0].status
      validateBookingTransition(current, nextStatus)
      if (nextStatus === "canceled" && rows[0].slot_id) {
        await tx`
          update public.availability_slots
          set is_booked = false
          where id = ${rows[0].slot_id}
        `
      }
      await tx`
        update public.bookings
        set
          status = ${nextStatus},
          paid_amount_myr = coalesce(${options?.paidAmount ?? null}, paid_amount_myr),
          updated_at = now()
        where id = ${bookingId}
      `
      await tx`
        insert into public.booking_events (booking_id, event_type, event_payload)
        values (
          ${bookingId},
          ${`status_${nextStatus}`},
          ${JSON.stringify({ nextStatus, ...options })}::jsonb
        )
      `
    })
  },
  // Helper to send booking confirmation email
  async sendBookingConfirmationEmail(bookingId: string) {
    try {
      const sql = getSql()
      const [booking] = await sql`
        select 
          b.*,
          s.name as service_name,
          p.display_name as provider_name,
          slot.starts_at,
          prof.email as customer_email,
          prof.full_name as customer_name
        from public.bookings b
        join public.services s on s.id = b.service_id
        join public.providers p on p.id = b.provider_id
        join public.availability_slots slot on slot.id = b.slot_id
        join public.profiles prof on prof.id = b.customer_id
        where b.id = ${bookingId}
      `
      
      if (!booking || !booking.customer_email) {
        console.log("No customer email found for booking:", bookingId)
        return
      }

      const date = new Date(booking.starts_at).toLocaleDateString("en-MY", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
      const time = new Date(booking.starts_at).toLocaleTimeString("en-MY", {
        hour: "2-digit",
        minute: "2-digit",
      })

      const template = bookingConfirmationTemplate({
        customerName: booking.customer_name || "Valued Customer",
        bookingId: booking.id,
        serviceName: booking.service_name,
        providerName: booking.provider_name,
        date,
        time,
        amount: booking.paid_amount_myr || booking.total_amount_myr,
        paymentType: booking.status === "paid_deposit" ? "deposit" : "full",
      })

      await sendEmail({
        to: booking.customer_email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      })

      // Log email sent
      await sql`
        insert into public.booking_events (booking_id, event_type, event_payload)
        values (
          ${bookingId},
          'confirmation_email_sent',
          ${JSON.stringify({ email: booking.customer_email })}::jsonb
        )
      `
    } catch (error) {
      console.error("Failed to send booking confirmation email:", error)
      // Don't throw - email failure shouldn't break booking flow
    }
  },
}
