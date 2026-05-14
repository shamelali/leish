"use server"

import { revalidatePath } from "next/cache"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { getSql } from "@/lib/db/postgres"

async function requireAdminUser() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) throw new Error("Not authenticated")

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !["admin", "studio_manager"].includes(profile.role)) {
    throw new Error("Forbidden")
  }

  return { user, supabase }
}

async function writeAuditLog(actorId: string, action: string, target: string, meta: Record<string, unknown> = {}) {
  try {
    const sql = getSql()
    await sql`insert into public.admin_audit_log (actor_id, action, target, meta) values (${actorId}, ${action}, ${target}, ${JSON.stringify(meta)})`
  } catch {
    console.error("[audit-log] write failed", { actorId, action, target })
  }
}

export async function activateProvider(providerId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.providers set is_active = true, is_suspended = false, suspended_at = null, suspended_by = null where id = ${providerId}`
  await writeAuditLog(user.id, "provider.activate", providerId)
  revalidatePath("/admin/providers")
}

export async function suspendProvider(providerId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.providers set is_active = false, is_suspended = true, suspended_at = NOW(), suspended_by = ${user.id} where id = ${providerId}`
  await writeAuditLog(user.id, "provider.suspend", providerId)
  revalidatePath("/admin/providers")
}

export async function flagProvider(providerId: string) {
  const { user } = await requireAdminUser()
  const supabase = await getSupabaseSsrClient()
  if (!supabase) throw new Error("Database unavailable")

  const { data: provider } = await supabase.from("providers").select("display_name").eq("id", providerId).single()

  const { error } = await supabase.from("provider_alerts").insert({
    provider_id: providerId,
    alert_type: "manual_review",
    severity: "medium",
    description: "Manual review flagged for " + (provider?.display_name || "provider"),
    status: "open",
    created_by: user.id,
  })

  if (error) {
    console.error("[flagProvider] error:", error)
    throw new Error("Failed to flag provider")
  }

  await writeAuditLog(user.id, "provider.flag", providerId)
  revalidatePath("/admin/providers")
}

export async function approveReview(reviewId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.reviews set status = 'published' where id = ${reviewId}`
  await writeAuditLog(user.id, "review.approve", reviewId)
  revalidatePath("/admin/moderation")
}

export async function hideReview(reviewId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.reviews set status = 'hidden' where id = ${reviewId}`
  await writeAuditLog(user.id, "review.hide", reviewId)
  revalidatePath("/admin/moderation")
}

export async function escalateReview(reviewId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.reviews set status = 'escalated' where id = ${reviewId}`
  await writeAuditLog(user.id, "review.escalate", reviewId)
  revalidatePath("/admin/moderation")
}

export async function resolveAlert(alertId: string, formData: FormData) {
  const { user } = await requireAdminUser()
  const supabase = await getSupabaseSsrClient()
  if (!supabase) throw new Error("Database unavailable")

  const notes = formData.get("resolution_notes")

  const { error } = await supabase.from("provider_alerts").update({ status: "resolved", resolution_notes: notes, resolved_by: user.id }).eq("id", alertId)

  if (error) {
    console.error("[resolveAlert] error:", error)
    throw new Error("Failed to resolve alert")
  }

  await writeAuditLog(user.id, "alert.resolve", alertId, { notes })
  revalidatePath("/admin/providers")
  revalidatePath("/admin/moderation")
}

export async function adminConfirmBooking(bookingId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.bookings set status = 'confirmed' where id = ${bookingId}`
  await writeAuditLog(user.id, "booking.confirm", bookingId)
  revalidatePath("/admin/bookings")
}

export async function adminCancelBooking(bookingId: string) {
  const { user } = await requireAdminUser()
  const sql = getSql()
  await sql`update public.bookings set status = 'canceled' where id = ${bookingId}`
  await writeAuditLog(user.id, "booking.cancel", bookingId)
  revalidatePath("/admin/bookings")
}
