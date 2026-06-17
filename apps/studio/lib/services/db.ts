import { getSql } from "@/lib/db/postgres"

export async function getUser() {
  const { getSupabaseSsrClient } = await import("@leish/shared/lib/auth/ssr")
  const supabase = await getSupabaseSsrClient()
  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) return null
  return data.user
}

export interface Service {
  id: string
  provider_id: string
  name: string
  duration_minutes: number
  price_myr: number
  is_active: boolean
}

export const serviceService = {
  async listByProvider(providerId: string) {
    const sql = getSql()
    const rows = await sql<Service[]>`
      select * from public.services where provider_id = ${providerId} and is_active = true
    `
    return rows
  },
  async create(input: { provider_id: string; name: string; duration_minutes: number; price_myr: number }) {
    const sql = getSql()
    const rows = await sql<{ id: string }[]>`
      insert into public.services (provider_id, name, duration_minutes, price_myr)
      values (${input.provider_id}, ${input.name}, ${input.duration_minutes}, ${input.price_myr})
      returning id
    `
    return rows[0] as Service
  },
  async update(id: string, updates: Record<string, unknown>) {
    const sql = getSql()
    for (const [key, value] of Object.entries(updates)) {
      const allowed = ["name", "duration_minutes", "price_myr", "is_active"]
      if (!allowed.includes(key)) continue
      if (key === "name") await sql`update public.services set name = ${String(value)} where id = ${id}`
      if (key === "duration_minutes") await sql`update public.services set duration_minutes = ${Number(value)} where id = ${id}`
      if (key === "price_myr") await sql`update public.services set price_myr = ${Number(value)} where id = ${id}`
      if (key === "is_active") await sql`update public.services set is_active = ${Boolean(value)} where id = ${id}`
    }
  },
  async delete(id: string) {
    const sql = getSql()
    await sql`delete from public.services where id = ${id}`
  },
}