import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { z } from "zod"

const upgradeSchema = z.object({
  plan: z.enum(["monthly", "annual"]),
  providerId: z.string().uuid(),
})

// Pricing constants (could move to env)
const PRICES = {
  monthly: 5900, // MYR 59.00 (cents)
  annual: 39900, // MYR 399.00 (cents) - ~RM33/mo
}

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

  // Parse body
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = upgradeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 })
  }

  const { plan, providerId } = parsed.data

  // Verify ownership
  const sql = getSql()
  const [provider] = await sql<{ id: string; owner_id: string; tier: string }[]>`
    select id, owner_id, tier from public.providers where id = ${providerId}
  `

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 })
  }

  if (provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 })
  }

  if (provider.tier === "pro") {
    return NextResponse.json({ error: "Already on premium plan" }, { status: 400 })
  }

  // For now, simulate payment flow - in production, integrate with Stripe/Billplz
  // This would create a checkout session
  const priceAmount = PRICES[plan]

  try {
    // Update provider to pro tier (in production, this happens after payment confirmation)
    const now = new Date()
    const expiresAt = plan === "monthly"
      ? new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
      : new Date(now.getFullYear() + 1, now.getMonth(), now.getDate())

    await sql`
      update public.providers set 
        tier = 'pro',
        tier_started_at = ${now},
        tier_expires_at = ${expiresAt},
        updated_at = now()
      where id = ${providerId}
    `

    // Log upgrade event (for analytics)
    await sql`
      insert into public.monitoring_logs (event_type, severity, message, metadata)
      values ('provider_upgraded', 'info', ${`Provider ${providerId} upgraded to ${plan}`}, ${JSON.stringify({ plan, amount: priceAmount, userId: user.id })}
    `

    return NextResponse.json({
      ok: true,
      tier: "pro",
      plan,
      expiresAt: expiresAt.toISOString(),
      message: "Successfully upgraded to Pro plan",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upgrade failed"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

// GET - Check current tier status
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

  const { searchParams } = new URL(req.url)
  const providerId = searchParams.get("providerId")

  if (!providerId) {
    return NextResponse.json({ error: "Missing providerId" }, { status: 400 })
  }

  const sql = getSql()
  const [provider] = await sql<{
    id: string
    tier: string
    tier_started_at: Date | null
    tier_expires_at: Date | null
    communication_violations: number
    is_suspended: boolean
  }[]>`
    select id, tier, tier_started_at, tier_expires_at, communication_violations, is_suspended 
    from public.providers 
    where id = ${providerId} and owner_id = ${user.id}
  `

  if (!provider) {
    return NextResponse.json({ error: "Provider not found" }, { status: 404 })
  }

  return NextResponse.json({
    tier: provider.tier,
    startedAt: provider.tier_started_at,
    expiresAt: provider.tier_expires_at,
    violations: provider.communication_violations,
    isSuspended: provider.is_suspended,
    features: provider.tier === "pro" ? PRO_FEATURES : FREE_FEATURES,
  })
}

// Feature definitions
const FREE_FEATURES = [
  "Basic profile with 5 portfolio images",
  "Manual calendar",
  "Up to 10 client contacts",
  "Internal chat (Leish-masked)",
  "Bank transfer / cash payments",
  "Basic analytics",
]

const PRO_FEATURES = [
  ...FREE_FEATURES,
  "Unlimited portfolio images & video gallery",
  "Smart scheduling with calendar sync",
  "Unlimited client management",
  "Automated SMS/WhatsApp reminders",
  "Stripe/Billplz payment integration",
  "Deposit collection & BNPL",
  "Client notes & preferences history",
  "Auto-follow-up sequences",
  "Revenue analytics & insights",
  "Priority support",
  "Custom profile URL (yourname.leish.my)",
  "Google Calendar sync",
]