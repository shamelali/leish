import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { sendEmail } from "@/lib/email/brevo"
import { authorizeCron } from "@/lib/ops/cron-auth"
import {
  CLOSED_STATUSES,
  REMINDER_WINDOW_HOURS,
  balanceReminderTemplate,
  outstandingBalance,
} from "@/lib/services/balance-reminders"

// Vercel kills the function after this many seconds; keep each sweep bounded.
export const maxDuration = 60

const BATCH_LIMIT = 100

/**
 * Daily sweep: email customers who paid a deposit and still owe a balance on
 * an appointment within the next REMINDER_WINDOW_HOURS. Each booking is
 * reminded once (tracked via booking_events.balance_reminder_sent).
 */
export async function GET(req: Request) {
  const denied = authorizeCron(req)
  if (denied) return denied

  try {
    const sql = getSql()
    const windowHours = `${REMINDER_WINDOW_HOURS} hours`

    const bookings = await sql`
      select
        b.id,
        b.total_amount_myr,
        b.paid_amount_myr,
        s.name as service_name,
        p.display_name as provider_name,
        slot.starts_at,
        prof.email as customer_email,
        prof.full_name as customer_name
      from public.bookings b
      join public.services s on s.id = b.service_id
      join public.providers p on p.id = b.provider_id
      join public.availability_slots slot on slot.id = b.slot_id
      join public.profiles prof on prof.id = b.customer_id
      where b.status::text not in ${sql([...CLOSED_STATUSES])}
        and b.paid_amount_myr > 0
        and b.paid_amount_myr < b.total_amount_myr
        and slot.starts_at between now() and now() + ${windowHours}::interval
        and not exists (
          select 1 from public.booking_events be
          where be.booking_id = b.id
            and be.event_type = 'balance_reminder_sent'
        )
      order by slot.starts_at
      limit ${BATCH_LIMIT}
    `

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"
    let sent = 0
    let skipped = 0
    let failed = 0

    for (const b of bookings) {
      const balance = outstandingBalance(b.total_amount_myr, b.paid_amount_myr)
      if (!b.customer_email || balance <= 0) {
        skipped++
        continue
      }

      try {
        const startsAt = new Date(b.starts_at)
        const template = balanceReminderTemplate({
          customerName: b.customer_name || "Valued Customer",
          bookingId: b.id,
          serviceName: b.service_name,
          providerName: b.provider_name,
          date: startsAt.toLocaleDateString("en-MY", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "Asia/Kuala_Lumpur",
          }),
          time: startsAt.toLocaleTimeString("en-MY", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "Asia/Kuala_Lumpur",
          }),
          balanceMyr: balance,
          payUrl: `${appUrl}/account`,
        })

        const result = await sendEmail({ to: b.customer_email, ...template })
        if (!result.success) {
          // Leave no event row so tomorrow's run retries this booking.
          console.error("Balance reminder email failed:", b.id, result.error)
          failed++
          continue
        }

        await sql`
          insert into public.booking_events (booking_id, event_type, event_payload)
          values (
            ${b.id},
            'balance_reminder_sent',
            ${JSON.stringify({ balance_myr: balance })}::jsonb
          )
        `
        sent++
      } catch (error) {
        console.error("Balance reminder failed for booking:", b.id, error)
        failed++
      }
    }

    return NextResponse.json({ ok: true, considered: bookings.length, sent, skipped, failed })
  } catch (error) {
    console.error("Balance reminder cron failed:", error)
    return NextResponse.json({ error: "Failed to process balance reminders" }, { status: 500 })
  }
}
