import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

// Billplz configuration
const BILLPLZ_API_KEY = process.env.BILLPLZ_API_KEY || ""
// Used in webhook verification
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BILLPLZ_X_SIGNATURE = process.env.BILLPLZ_X_SIGNATURE || ""
const BILLPLZ_API_URL = process.env.BILLPLZ_API_URL || "https://www.billplz.com/api/v4"
const BILLPLZ_COLLECTION_ID = process.env.BILLPLZ_COLLECTION_ID || ""

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: { providerId: string; tier: "pro"; billingCycle?: "monthly" | "yearly" }
  
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  }

  const { providerId, tier, billingCycle = "monthly" } = payload

  if (!providerId || tier !== "pro") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  // Verify provider ownership
  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id, display_name")
    .eq("id", providerId)
    .single()

  if (!provider || provider.owner_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    // Get user profile for email
    const { data: userProfile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", user.id)
      .single()

    const amount = billingCycle === "yearly" ? 99900 : 9900 // RM999 or RM99 in cents
    const description = `Leish Pro Subscription (${billingCycle}) - ${provider.display_name}`
    const redirectUrl = `${process.env.NEXT_PUBLIC_APP_URL}/pro/upgrade?status=paid`
    
    // Create Billplz bill
    const billResponse = await fetch(`${BILLPLZ_API_URL}/bills`, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${Buffer.from(BILLPLZ_API_KEY + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        collection_id: BILLPLZ_COLLECTION_ID,
        email: userProfile?.email,
        name: provider.display_name || userProfile?.full_name,
        amount: amount,
        callback_url: `${process.env.BILLPLZ_WEBHOOK_URL || process.env.NEXT_PUBLIC_APP_URL}/api/subscription/webhook`,
        redirect_url: redirectUrl,
        description: description,
        reference_1: providerId,
        reference_1_label: "Provider ID",
        reference_2: billingCycle,
        reference_2_label: "Billing Cycle",
      }),
    })

    if (!billResponse.ok) {
      const errorData = await billResponse.json()
      console.error("[billplz] bill creation failed:", errorData)
      throw new Error("Failed to create bill")
    }

    const billData = await billResponse.json()

    // Save pending subscription
    await supabase.from("subscription_history").insert({
      provider_id: providerId,
      tier: "pro",
      action: "upgrade",
      amount_myr: amount / 100,
      stripe_subscription_id: billData.id, // Using bill ID as reference
    })

    // Redirect to Billplz payment page
    return NextResponse.json({ 
      url: billData.url,
      billId: billData.id 
    })

  } catch (error: unknown) {
    console.error("[subscription/checkout] error:", error)
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create checkout" },
      { status: 500 }
    )
  }
}