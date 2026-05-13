/**
 * Booking Cleanup & Expiration Job
 * 
 * Runs every hour to:
 * 1. Expire abandoned bookings (payment_required > 2 hours)
 * 2. Cancel unpaid bookings (pending > 24 hours)
 * 3. Free up slots for cancelled/expired bookings
 * 4. Send reminder emails for upcoming bookings
 */

import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendEmail } from "@/lib/email/resend"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const CRON_SECRET = process.env.CRON_SECRET

interface CleanupResult {
  expired: number
  cancelled: number
  reminded: number
  slotsFreed: number
}

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const result: CleanupResult = {
    expired: 0,
    cancelled: 0,
    reminded: 0,
    slotsFreed: 0,
  }

  try {
    // 1. Expire abandoned bookings (payment_required > 2 hours)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    
    const { data: abandonedBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        slot_id,
        customer_id,
        provider_id,
        created_at,
        total_amount_myr,
        profiles!bookings_customer_id_fkey(email, full_name),
        providers!bookings_provider_id_fkey(name)
      `)
      .eq("status", "payment_required")
      .lt("created_at", twoHoursAgo)
      .limit(100)

    if (abandonedBookings) {
      for (const booking of abandonedBookings) {
        // Cancel the booking
        await supabase
          .from("bookings")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
            notes: `[Auto-canceled: Payment not completed within 2 hours]`,
          })
          .eq("id", booking.id)

        // Free up the slot
        if (booking.slot_id) {
          await supabase
            .from("availability_slots")
            .update({ is_booked: false })
            .eq("id", booking.slot_id)
          result.slotsFreed++
        }

        // Log the event
        await supabase.from("booking_events").insert({
          booking_id: booking.id,
          event_type: "booking_expired",
          event_payload: {
            reason: "Payment not completed within 2 hours",
            expiredAt: new Date().toISOString(),
          },
        })

        // Send cancellation email to customer
        const customerEmail = (booking as unknown as { profiles: { email: string; full_name: string } }).profiles?.email
        if (customerEmail) {
          await sendEmail({
            to: customerEmail,
            subject: "Your Booking Has Expired - Leish",
            html: `
              <h2>Booking Expired</h2>
              <p>Hi ${(booking as unknown as { profiles: { full_name: string } }).profiles?.full_name || "there"},</p>
              <p>Your booking with <strong>${(booking as unknown as { providers: { name: string } }).providers?.name}</strong> has expired because payment was not completed within 2 hours.</p>
              <p><strong>Booking Details:</strong></p>
              <ul>
                <li>Amount: RM ${(booking.total_amount_myr / 100).toFixed(2)}</li>
                <li>Created: ${new Date(booking.created_at).toLocaleString("en-MY")}</li>
              </ul>
              <p>You can make a new booking at any time.</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/artists" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none;">Browse Artists</a></p>
            `,
            text: `Your booking has expired because payment was not completed within 2 hours. You can make a new booking at ${process.env.NEXT_PUBLIC_APP_URL}/artists`,
          })
        }

        result.expired++
      }
    }

    // 2. Cancel unpaid pending bookings (> 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    
    const { data: stalePendingBookings } = await supabase
      .from("bookings")
      .select("id, slot_id, created_at")
      .eq("status", "pending")
      .lt("created_at", twentyFourHoursAgo)
      .limit(50)

    if (stalePendingBookings) {
      for (const booking of stalePendingBookings) {
        await supabase
          .from("bookings")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
            notes: `[Auto-canceled: No provider response within 24 hours]`,
          })
          .eq("id", booking.id)

        if (booking.slot_id) {
          await supabase
            .from("availability_slots")
            .update({ is_booked: false })
            .eq("id", booking.slot_id)
          result.slotsFreed++
        }

        await supabase.from("booking_events").insert({
          booking_id: booking.id,
          event_type: "booking_auto_canceled",
          event_payload: {
            reason: "No provider response within 24 hours",
            canceledAt: new Date().toISOString(),
          },
        })

        result.cancelled++
      }
    }

    // 3. Send reminders for upcoming bookings (24 hours before)
    const tomorrowStart = new Date(Date.now() + 24 * 60 * 60 * 1000)
    tomorrowStart.setHours(0, 0, 0, 0)
    const tomorrowEnd = new Date(tomorrowStart)
    tomorrowEnd.setHours(23, 59, 59, 999)

    const { data: upcomingBookings } = await supabase
      .from("bookings")
      .select(`
        id,
        customer_id,
        provider_id,
        slot_id,
        status,
        availability_slots!bookings_slot_id_fkey(starts_at),
        profiles!bookings_customer_id_fkey(email, full_name, phone),
        providers!bookings_provider_id_fkey(name, phone)
      `)
      .in("status", ["confirmed", "paid_deposit", "paid_full"])
      .gte("availability_slots.starts_at", tomorrowStart.toISOString())
      .lte("availability_slots.starts_at", tomorrowEnd.toISOString())
      .limit(50)

    if (upcomingBookings) {
      for (const booking of upcomingBookings) {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("booking_events")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("event_type", "reminder_sent_24h")
          .maybeSingle()

        if (!existingReminder) {
          const slot = (booking as unknown as { availability_slots: { starts_at: string } }).availability_slots
          const customer = (booking as unknown as { profiles: { email: string; full_name: string } }).profiles
          const provider = (booking as unknown as { providers: { name: string; phone: string } }).providers

          // Send reminder email
          if (customer?.email) {
            await sendEmail({
              to: customer.email,
              subject: "Reminder: Your Appointment is Tomorrow - Leish",
              html: `
                <h2>Appointment Reminder</h2>
                <p>Hi ${customer.full_name || "there"},</p>
                <p>This is a friendly reminder that you have an appointment with <strong>${provider?.name}</strong> tomorrow.</p>
                <p><strong>Appointment Details:</strong></p>
                <ul>
                  <li>Date: ${new Date(slot.starts_at).toLocaleDateString("en-MY", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</li>
                  <li>Time: ${new Date(slot.starts_at).toLocaleTimeString("en-MY", { hour: "numeric", minute: "2-digit" })}</li>
                  <li>Provider: ${provider?.name}</li>
                </ul>
                <p>Please arrive on time. If you need to reschedule, please contact us as soon as possible.</p>
                <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/booking/${booking.id}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none;">View Booking</a></p>
              `,
              text: `Reminder: You have an appointment with ${provider?.name} tomorrow at ${new Date(slot.starts_at).toLocaleTimeString("en-MY")}.`,
            })
          }

          // Log reminder sent
          await supabase.from("booking_events").insert({
            booking_id: booking.id,
            event_type: "reminder_sent_24h",
            event_payload: {
              sentAt: new Date().toISOString(),
              method: "email",
            },
          })

          result.reminded++
        }
      }
    }

    // 4. Log cleanup results
    await supabase.from("monitoring_logs").insert({
      check_type: "booking_cleanup",
      status: "ok",
      details: {
        ...result,
        runAt: new Date().toISOString(),
      },
    })

    return NextResponse.json({
      ok: true,
      runAt: new Date().toISOString(),
      result,
    })
  } catch (error) {
    console.error("Booking cleanup error:", error)
    
    // Log error
    await supabase.from("monitoring_logs").insert({
      check_type: "booking_cleanup",
      status: "error",
      details: {
        error: error instanceof Error ? error.message : "Unknown error",
        runAt: new Date().toISOString(),
      },
    })

    return NextResponse.json(
      { ok: false, error: "Cleanup job failed" },
      { status: 500 }
    )
  }
}
