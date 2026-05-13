import { Resend } from "resend"

// Lazy initialization to avoid build-time errors
let resendClient: Resend | null = null

function getResendClient(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error("RESEND_API_KEY is not set")
    }
    resendClient = new Resend(apiKey)
  }
  return resendClient
}

export type EmailPayload = {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  fromName?: string
}

export async function sendEmail(payload: EmailPayload) {
  const fromEmail = payload.from || process.env.FROM_EMAIL || "hello@leish.my"
  const fromName = payload.fromName || process.env.FROM_NAME || "Beaute"
  
  try {
    const resend = getResendClient()
    const { data, error } = await resend.emails.send({
      from: `${fromName} <${fromEmail}>`,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    })

    if (error) {
      console.error("Email send failed:", error)
      return { success: false, error }
    }

    return { success: true, data }
  } catch (err) {
    console.error("Email send exception:", err)
    return { success: false, error: err }
  }
}
