import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { z } from "zod"

const reportSchema = z.object({
  reporterId: z.string().uuid(),
  reportedProviderId: z.string().uuid(),
  violationType: z.enum(["external_contact_request", "phone_shared", "social_shared", "other"]),
  context: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = reportSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 })
  }

  const { reporterId, reportedProviderId, violationType, context } = parsed.data

  // Verify reporter is the authenticated user
  if (reporterId !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  const sql = getSql()

  try {
    // Get the provider's owner
    const [provider] = await sql<{ owner_id: string; communication_violations: number }[]>`
      select owner_id, communication_violations from public.providers where id = ${reportedProviderId}
    `

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Increment violation count
    const newViolationCount = (provider.communication_violations || 0) + 1

    // Determine action based on violation count
    let shouldSuspend = false
    let suspensionDays = 0
    let reason = ""

    if (newViolationCount >= 3) {
      shouldSuspend = true
      suspensionDays = 0 // 0 = permanent
      reason = "Multiple communication violations - permanent suspension"
    } else if (newViolationCount === 2) {
      suspensionDays = 7
      reason = "Second communication violation - 7 day suspension"
    } else {
      reason = "First communication violation - warning"
    }

    // Update provider with violation
    if (shouldSuspend) {
      await sql`
        update public.providers set 
          communication_violations = ${newViolationCount},
          is_suspended = true,
          suspension_reason = ${reason},
          suspended_at = now(),
          updated_at = now()
        where id = ${reportedProviderId}
      `
    } else {
      await sql`
        update public.providers set 
          communication_violations = ${newViolationCount},
          suspension_reason = ${reason},
          updated_at = now()
        where id = ${reportedProviderId}
      `
    }

    // Log the violation for admin review
    await sql`
      insert into public.monitoring_logs (event_type, severity, message, metadata)
      values (
        'communication_violation', 
        'warning', 
        ${`Violation report against provider ${reportedProviderId}`},
        ${JSON.stringify({ 
          reporterId, 
          violationType, 
          context,
          violationCount: newViolationCount,
          action: shouldSuspend ? "suspended" : suspensionDays > 0 ? "warning" : "counted"
        })}
      )
    `

    return NextResponse.json({
      ok: true,
      violationCount: newViolationCount,
      action: shouldSuspend ? "suspended" : suspensionDays > 0 ? "warning" : "logged",
      suspensionDays: shouldSuspend ? null : suspensionDays,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to report violation"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// GET - Get violation status for a provider (for admin/owner view)
export async function GET(req: NextRequest) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const isAdmin = profile?.role === "admin"

  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  // Only admin or owner can view violation details
  const sql = getSql()
  const [provider] = await sql<{ owner_id: string; communication_violations: number; is_suspended: boolean; suspension_reason: string | null }[]>`
    select owner_id, communication_violations, is_suspended, suspension_reason 
    from public.providers where id = ${providerId}
  `

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 })
  }

  if (provider.owner_id !== user.id && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  return NextResponse.json({
    violations: provider.communication_violations,
    isSuspended: provider.is_suspended,
    suspensionReason: provider.suspension_reason,
    // Warning thresholds
    warningAt: 1,
    suspensionAt: 3,
  })
}