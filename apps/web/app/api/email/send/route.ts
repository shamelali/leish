import { NextResponse } from "next/server"
import { sendEmail } from "@/lib/email/brevo"
import { bookingConfirmationTemplate, welcomeEmailTemplate, paymentReceiptTemplate } from "@/lib/email/templates"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { z } from "zod"

const emailSchema = z.object({
  type: z.enum(["booking_confirmation", "welcome", "payment_receipt"]),
  to: z.string().email(),
  params: z.record(z.unknown()),
})

const bookingParamsSchema = z.object({
  customerName: z.string(),
  bookingId: z.string(),
  serviceName: z.string(),
  providerName: z.string(),
  date: z.string(),
  time: z.string(),
  amount: z.number(),
  paymentType: z.enum(["full", "deposit"]),
})

const welcomeParamsSchema = z.object({
  name: z.string(),
})

const receiptParamsSchema = z.object({
  customerName: z.string(),
  bookingId: z.string(),
  amount: z.number(),
  paymentMethod: z.string(),
  date: z.string(),
})

export async function POST(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = emailSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 })
  }

  const { type, to, params } = parsed.data

  let template
  switch (type) {
    case "booking_confirmation": {
      const p = bookingParamsSchema.parse(params)
      template = bookingConfirmationTemplate(p)
      break
    }
    case "welcome": {
      const p = welcomeParamsSchema.parse(params)
      template = welcomeEmailTemplate(p)
      break
    }
    case "payment_receipt": {
      const p = receiptParamsSchema.parse(params)
      template = paymentReceiptTemplate(p)
      break
    }
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
}
