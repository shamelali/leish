import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/brevo"
import { bookingConfirmationTemplate, welcomeEmailTemplate, paymentReceiptTemplate } from "@/lib/email/templates"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

type EmailType = "booking_confirmation" | "welcome" | "payment_receipt"

export async function POST(req: Request) {
  // Check authentication
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { type, to, params } = body as { type: EmailType; to: string; params: Record<string, unknown> }

    if (!type || !to) {
      return NextResponse.json({ error: "Missing required fields: type, to" }, { status: 400 })
    }

    let template
    switch (type) {
      case "booking_confirmation":
        template = bookingConfirmationTemplate(params as {
          customerName: string
          bookingId: string
          serviceName: string
          providerName: string
          date: string
          time: string
          amount: number
          paymentType: "full" | "deposit"
        })
        break
      case "welcome":
        template = welcomeEmailTemplate(params as { name: string })
        break
      case "payment_receipt":
        template = paymentReceiptTemplate(params as {
          customerName: string
          bookingId: string
          amount: number
          paymentMethod: string
          date: string
        })
        break
      default:
        return NextResponse.json({ error: "Invalid email type" }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })

    if (!result.success) {
      return NextResponse.json({ error: "Failed to send email", details: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, messageId: result.data?.id })
  } catch (error) {
    console.error("Email API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
