import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/postgres";
import { sendEmail } from "@/lib/email/resend";
import { bookingReminderTemplate } from "@/lib/email/templates";
import { sendBookingReminder } from "@/lib/notifications/whatsapp";

// Cron endpoint to send 24-hour reminder emails and SMS/WhatsApp
// Should be called by Vercel Cron or external scheduler

export async function GET(req: Request) {
  // Simple auth check using CRON_SECRET
  const authHeader = req.headers.get("authorization");
  const expectedSecret = process.env.CRON_SECRET;

  if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sql = getSql();

    // Find bookings starting in ~24 hours that haven't had reminders sent
    const bookings = await sql`
      select 
        b.id,
        b.customer_id,
        s.name as service_name,
        p.display_name as provider_name,
        slot.starts_at,
        prof.email as customer_email,
        prof.full_name as customer_name,
        prof.phone as customer_phone
      from public.bookings b
      join public.services s on s.id = b.service_id
      join public.providers p on p.id = b.provider_id
      join public.availability_slots slot on slot.id = b.slot_id
      join public.profiles prof on prof.id = b.customer_id
      where b.status in ('confirmed', 'paid_deposit', 'paid_full')
        and slot.starts_at between now() + interval '23 hours' and now() + interval '25 hours'
        and not exists (
          select 1 from public.booking_events be
          where be.booking_id = b.id
            and be.event_type = 'reminder_sent'
        )
      limit 100
    `;

    let sentEmail = 0;
    let sentSms = 0;
    let failed = 0;

    for (const booking of bookings) {
      try {
        const date = new Date(booking.starts_at).toLocaleDateString("en-MY", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        const time = new Date(booking.starts_at).toLocaleTimeString("en-MY", {
          hour: "2-digit",
          minute: "2-digit",
        });

        // Send email notification
        if (booking.customer_email) {
          const template = bookingReminderTemplate({
            customerName: booking.customer_name || "Valued Customer",
            bookingId: booking.id,
            serviceName: booking.service_name,
            providerName: booking.provider_name,
            date,
            time,
          });

          const result = await sendEmail({
            to: booking.customer_email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });

          if (result.success) {
            sentEmail++;
          } else {
            console.error("Failed to send email reminder:", result.error);
          }
        }

        // Send WhatsApp notification if phone available
        if (booking.customer_phone) {
          const whatsappResult = await sendBookingReminder({
            customerName: booking.customer_name || "Valued Customer",
            bookingId: booking.id,
            serviceName: booking.service_name,
            providerName: booking.provider_name,
            date,
            time,
            phone: booking.customer_phone,
          });

          if (whatsappResult.success) {
            sentSms++;
          } else {
            console.error(
              "Failed to send WhatsApp reminder:",
              whatsappResult.error,
            );
          }
        }

        // Log reminder sent (combined event)
        await sql`
          insert into public.booking_events (booking_id, event_type, event_payload)
          values (
            ${booking.id},
            'reminder_sent',
            ${JSON.stringify({ email: booking.customer_email, phone: booking.customer_phone, sentEmail, sentSms })}::jsonb
          )
        `;
      } catch (error) {
        console.error("Error sending reminder for booking:", booking.id, error);
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      emailSent: sentEmail,
      whatsappSent: sentSms,
      failed,
      totalBookings: bookings.length,
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return NextResponse.json(
      { error: "Failed to process reminders" },
      { status: 500 },
    );
  }
}
