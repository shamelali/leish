import { NextResponse } from "next/server"
import { createBillplzPayment } from "@/lib/payments/billplz"
import { enforceRateLimit } from "@/lib/ops/rate-limit"
import { reportApiError } from "@/lib/ops/alerts"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables")
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

type Payload = {
  bookingId: string
  amountMyr: number
  customerName: string
  customerEmail: string
  paymentType?: "full" | "deposit"
}

export async function POST(req: Request) {
  const limit = enforceRateLimit(req, "payments:billplz:create", 15, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many payment attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    )
  }

  let payload: Payload
  try {
    payload = (await req.json()) as Payload
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  try {
    const paymentType = payload.paymentType ?? "full"
    const result = await createBillplzPayment(payload)
    try {
      const supabase = getServiceClient()
      
      // Check if payment record already exists
      const { data: existing } = await supabase
        .from("payments")
        .select("id")
        .eq("payment_intent_id", result.referenceId)
        .maybeSingle()

      if (existing) {
        // Update existing
        await supabase
          .from("payments")
          .update({
            webhook_payload: { payment_type: paymentType },
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
      } else {
        // Insert new
        await supabase.from("payments").insert({
          booking_id: payload.bookingId,
          provider: "billplz",
          payment_intent_id: result.referenceId,
          status: "requires_confirmation",
          amount_myr: payload.amountMyr,
          currency: "MYR",
          webhook_payload: { payment_type: paymentType },
        })
      }
    } catch {
      // Allow checkout redirect even if local booking/payment persistence is not ready yet.
    }

    return NextResponse.json({ ok: true, paymentType, ...result })
  } catch (error) {
    await reportApiError("billplz_create", error, { bookingId: payload?.bookingId ?? null })
    const message = error instanceof Error ? error.message : "Billplz create failed"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}
