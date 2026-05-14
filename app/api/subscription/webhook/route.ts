import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import crypto from "crypto"

// Billplz configuration
const BILLPLZ_X_SIGNATURE = process.env.BILLPLZ_X_SIGNATURE || ""

export async function POST(req: Request) {
  const payload = await req.text()
  const signature = req.headers.get("x-signature")

  // Verify Billplz signature
  if (signature && BILLPLZ_X_SIGNATURE) {
    const expectedSignature = crypto
      .createHmac("sha256", BILLPLZ_X_SIGNATURE)
      .update(payload)
      .digest("hex")
    
    if (signature !== expectedSignature) {
      console.error("[billplz-webhook] invalid signature")
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }
  }

  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Database unavailable" }, { status: 500 })
  }

  try {
    const data = JSON.parse(payload)
    const { id: billId, state, paid_amount, reference_1, reference_2 } = data
    
    const providerId = reference_1
    const billingCycle = reference_2 || "monthly"

    if (state === "paid") {
      // Calculate expiry date based on billing cycle
      const tierStartedAt = new Date()
      const tierExpiresAt = new Date()
      if (billingCycle === "yearly") {
        tierExpiresAt.setFullYear(tierExpiresAt.getFullYear() + 1)
      } else {
        tierExpiresAt.setMonth(tierExpiresAt.getMonth() + 1)
      }

      // Update provider to Pro tier
      const { error } = await supabase
        .from("providers")
        .update({
          tier: "pro",
          tier_started_at: tierStartedAt.toISOString(),
          tier_expires_at: tierExpiresAt.toISOString(),
        })
        .eq("id", providerId)

      if (error) {
        console.error("[billplz-webhook] failed to update provider:", error)
        return NextResponse.json({ error: "Database error" }, { status: 500 })
      }

      // Log the subscription
      await supabase.from("subscription_history").insert({
        provider_id: providerId,
        tier: "pro",
        action: "upgrade",
        stripe_subscription_id: billId, // Using bill ID as reference
        amount_myr: paid_amount ? parseInt(paid_amount) / 100 : (billingCycle === "yearly" ? 999 : 99),
        billing_period_start: tierStartedAt.toISOString(),
        billing_period_end: tierExpiresAt.toISOString(),
      })

      console.log(`[billplz-webhook] Provider ${providerId} upgraded to Pro`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[billplz-webhook] error:", error)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}