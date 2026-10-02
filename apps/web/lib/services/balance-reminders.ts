/**
 * Balance-due reminders for deposit-paid bookings.
 *
 * A booking owes a balance when the customer has paid something
 * (paid_amount_myr > 0) but less than the total. We remind once, when the
 * appointment is within REMINDER_WINDOW_HOURS. Idempotency is tracked through
 * a `balance_reminder_sent` row in public.booking_events.
 */

export const REMINDER_WINDOW_HOURS = 72

/** Statuses for which chasing a balance makes no sense. */
export const CLOSED_STATUSES = [
  "cancelled",
  "canceled",
  "refunded",
  "expired",
  "completed",
] as const

export function outstandingBalance(totalMyr: number, paidMyr: number): number {
  const balance = Math.round((Number(totalMyr) - Number(paidMyr)) * 100) / 100
  return balance > 0 ? balance : 0
}

export function balanceReminderTemplate(params: {
  customerName: string
  bookingId: string
  serviceName: string
  providerName: string
  date: string
  time: string
  balanceMyr: number
  payUrl: string
}) {
  const amount = `RM ${params.balanceMyr.toFixed(2)}`
  const esc = escapeHtml
  const subject = `Balance due for your ${params.serviceName} booking`

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Balance due</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px">
  <div style="background:#c9a96e;color:#fff;padding:30px;text-align:center"><h1>Balance due</h1></div>
  <div style="background:#f9f9f9;padding:30px;margin:20px 0">
    <p>Hi ${esc(params.customerName)},</p>
    <p>Your appointment with <strong>${esc(params.providerName)}</strong> is coming up on
    <strong>${esc(params.date)}</strong> at <strong>${esc(params.time)}</strong>.</p>
    <p>An outstanding balance of <strong>${amount}</strong> is due for
    <strong>${esc(params.serviceName)}</strong> (booking ${esc(params.bookingId)}).</p>
    <p><a href="${esc(params.payUrl)}" style="display:inline-block;background:#1a1a1a;color:#fff;padding:12px 24px;text-decoration:none">Pay balance</a></p>
  </div>
  <p style="text-align:center;color:#666;font-size:12px">Leish · Malaysia's beauty booking marketplace</p>
</body></html>`

  const text = [
    `Hi ${params.customerName},`,
    ``,
    `Your appointment with ${params.providerName} is on ${params.date} at ${params.time}.`,
    `An outstanding balance of ${amount} is due for ${params.serviceName} (booking ${params.bookingId}).`,
    ``,
    `Pay here: ${params.payUrl}`,
  ].join("\n")

  return { subject, html, text }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
