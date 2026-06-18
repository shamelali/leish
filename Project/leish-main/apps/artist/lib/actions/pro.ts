"use server"

import { revalidatePath } from "next/cache"
import { getSql } from "@/lib/db/postgres"

async function requireArtistUser() {
  const { getSupabaseSsrClient } = await import("@leish/shared/lib/auth/ssr")
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
  if (!profile || !["artist", "admin"].includes(profile.role)) throw new Error("Forbidden")
  return { user, supabase }
}

async function getProviderForUser(supabase: any, userId: string): Promise<string | null> {
  const { data } = await supabase.from("providers").select("id").eq("owner_id", userId).limit(1).maybeSingle()
  return data?.id ?? null
}

export async function proConfirmBooking(bookingId: string) {
  const { user, supabase } = await requireArtistUser()
  const providerId = await getProviderForUser(supabase, user.id)
  if (!providerId) throw new Error("No provider found")
  const sql = getSql()
  await sql`
    update public.bookings set status = 'confirmed'
    where id = ${bookingId} and provider_id = ${providerId} and status = 'pending'
  `
  revalidatePath("/bookings")
}

export async function proCancelBooking(bookingId: string) {
  const { user, supabase } = await requireArtistUser()
  const providerId = await getProviderForUser(supabase, user.id)
  if (!providerId) throw new Error("No provider found")
  const sql = getSql()
  await sql`
    update public.bookings set status = 'canceled'
    where id = ${bookingId} and provider_id = ${providerId} and status in ('pending', 'confirmed')
  `
  revalidatePath("/bookings")
}

export async function proToggleActive(providerId: string, isActive: boolean) {
  const { user, supabase } = await requireArtistUser()
  const ownedProviderId = await getProviderForUser(supabase, user.id)
  if (ownedProviderId !== providerId) throw new Error("Forbidden")
  const sql = getSql()
  await sql`update public.providers set is_active = ${isActive} where id = ${providerId}`
  revalidatePath("/")
  revalidatePath("/profile")
}
