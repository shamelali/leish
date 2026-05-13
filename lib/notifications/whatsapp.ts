/**
 * WhatsApp Cloud API notification service
 *
 * Uses Meta's WhatsApp Business Cloud API (free tier: 1,000 conversations/month).
 * Replaces Twilio for WhatsApp messaging.
 *
 * Setup: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID
const WHATSAPP_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN
const WHATSAPP_BASE_URL = "https://graph.facebook.com/v20.0"

function getAuthHeaders() {
  if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN) {
    throw new Error("Missing WhatsApp Cloud API credentials")
  }
  return {
    "Authorization": `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  }
}

/**
 * Format Malaysian phone number to E.164 format
 * - 0123456789 → +60123456789
 * - 60123456789 → +60123456789
 * - +60123456789 → +60123456789
 */
function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "")
  if (cleaned.startsWith("+")) return cleaned
  if (cleaned.startsWith("60")) return `+${cleaned}`
  if (cleaned.startsWith("0")) return `+60${cleaned.slice(1)}`
  return `+60${cleaned}`
}

interface SendMessageResult {
  success: boolean
  messageId?: string
  status?: string
  error?: string
}

/**
 * Send a WhatsApp message via Cloud API
 */
async function sendMessage(
  to: string,
  message: string
): Promise<SendMessageResult> {
  const phoneNumberId = WHATSAPP_PHONE_NUMBER_ID
  if (!phoneNumberId) {
    return { success: false, error: "WhatsApp not configured" }
  }

  const formattedTo = formatPhoneNumber(to)

  try {
    const response = await fetch(
      `${WHATSAPP_BASE_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: formattedTo,
          type: "text",
          text: { body: message },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error("WhatsApp API error:", data)
      return {
        success: false,
        error: data.error?.message || "Failed to send message",
      }
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id,
      status: data.messages?.[0]?.message_status,
    }
  } catch (error) {
    console.error("Failed to send WhatsApp message:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

// ── Template helpers ─────────────────────────────────────────────

export async function sendBookingConfirmation({
  customerName,
  bookingId,
  serviceName,
  providerName,
  date,
  time,
  phone,
}: {
  customerName: string
  bookingId: string
  serviceName: string
  providerName: string
  date: string
  time: string
  phone: string
}) {
  const message = `Hi ${customerName}! Your booking is confirmed.\n\n` +
    `${serviceName} with ${providerName}\n` +
    `📅 ${date} at ${time}\n` +
    `📋 Ref: ${bookingId}\n\n` +
    `Thank you for choosing Beaute!`

  return sendMessage(phone, message)
}

export async function sendBookingReminder({
  customerName,
  bookingId,
  serviceName,
  providerName,
  date,
  time,
  phone,
}: {
  customerName: string
  bookingId: string
  serviceName: string
  providerName: string
  date: string
  time: string
  phone: string
}) {
  const message = `Hi ${customerName}! Reminder: Your appointment is tomorrow.\n\n` +
    `${serviceName} with ${providerName}\n` +
    `📅 ${date} at ${time}\n` +
    `📋 Ref: ${bookingId}\n\n` +
    `Need to reschedule? Contact us at least 24hrs in advance.`

  return sendMessage(phone, message)
}

export async function sendPaymentConfirmation({
  customerName,
  bookingId,
  amount,
  phone,
}: {
  customerName: string
  bookingId: string
  amount: number
  phone: string
}) {
  const message = `Hi ${customerName}! Payment received.\n\n` +
    `💰 MYR ${amount}\n` +
    `📋 Ref: ${bookingId}\n\n` +
    `Thank you! - Beaute`

  return sendMessage(phone, message)
}

export async function sendCancellationNotice({
  customerName,
  bookingId,
  phone,
}: {
  customerName: string
  bookingId: string
  phone: string
}) {
  const message = `Hi ${customerName}, your booking has been cancelled.\n\n` +
    `📋 Ref: ${bookingId}\n\n` +
    `If you have questions, contact us at hello@leish.my\n` +
    `- Beaute`

  return sendMessage(phone, message)
}
