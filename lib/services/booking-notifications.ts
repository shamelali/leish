import { createClient } from "@supabase/supabase-js"
import { getSupabaseServerClient } from "@/lib/supabase/server"
import { notificationService } from "@/lib/services/notifications"
import { sendEmail } from "@/lib/email/brevo"
import {
  sendBookingConfirmation,
  sendCancellationNotice,
} from "@/lib/notifications/whatsapp"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

function formatPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("60") && digits.length >= 11) return digits
  if (digits.startsWith("0")) return "60" + digits.slice(1)
  return null
}

export async function sendBookingConfirmationSms(bookingId: string) {
  const supabase = getServiceClient()
  if (!supabase) return

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        id, customer_id, provider_id, scheduled_at, total_amount_myr, status,
        profiles!customer_id(full_name, phone),
        providers!provider_id(display_name)
      `)
      .eq("id", bookingId)
      .single()

    if (!booking) return

    const phone = (booking.profiles as unknown as { phone?: string }[])?.[0]?.phone
    const customerName = (booking.profiles as unknown as { full_name?: string }[])?.[0]?.full_name || "Customer"
    const providerName = (booking.providers as unknown as { display_name?: string }[])?.[0]?.display_name || "Provider"

    const formattedPhone = phone ? formatPhone(phone) : null
    if (formattedPhone && booking.status === "confirmed") {
      await sendBookingConfirmation({
        phone: formattedPhone,
        customerName,
        bookingId,
        providerName,
        serviceName: "Booking",
        date: booking.scheduled_at
          ? new Date(booking.scheduled_at).toLocaleDateString()
          : "TBC",
        time: "TBC",
      })
    }
  } catch (error) {
    console.error("[booking-notifications] sms confirm error:", error)
  }

  // Also send in-app notification
  try {
    const { data: booking } = await supabase!
      .from("bookings")
      .select("customer_id, providers!provider_id(display_name)")
      .eq("id", bookingId)
      .single()

    if (booking) {
      const providerName =
        (booking.providers as unknown as { display_name?: string }[])?.[0]?.display_name || "Provider"
      await notifyBookingStatusChange(bookingId, booking.customer_id, "", "confirmed", providerName)
    }
  } catch {
    // silently fail
  }
}

export async function sendBookingCancellationSms(bookingId: string) {
  const supabase = getServiceClient()
  if (!supabase) return

  try {
    const { data: booking } = await supabase
      .from("bookings")
      .select(`
        id, customer_id, status,
        profiles!customer_id(full_name, phone),
        providers!provider_id(display_name)
      `)
      .eq("id", bookingId)
      .single()

    if (!booking) return

    const phone = (booking.profiles as unknown as { phone?: string }[])?.[0]?.phone
    const customerName = (booking.profiles as unknown as { full_name?: string }[])?.[0]?.full_name || "Customer"

    const formattedPhone = phone ? formatPhone(phone) : null
    if (formattedPhone) {
      await sendCancellationNotice({
        phone: formattedPhone,
        customerName,
        bookingId,
      })
    }
  } catch (error) {
    console.error("[booking-notifications] sms cancel error:", error)
  }

  // Also send in-app notification
  try {
    const { data: booking } = await supabase!
      .from("bookings")
      .select("customer_id, providers!provider_id(display_name)")
      .eq("id", bookingId)
      .single()

    if (booking) {
      const providerName =
        (booking.providers as unknown as { display_name?: string }[])?.[0]?.display_name || "Provider"
      await notifyBookingStatusChange(bookingId, booking.customer_id, "", "canceled", providerName)
    }
  } catch {
    // silently fail
  }
}

// In-app notification helpers
const TRANSITION_MESSAGES: Record<string, { title: string; body: string }> = {
  confirmed: {
    title: "Booking Confirmed",
    body: "Your booking has been confirmed by the provider.",
  },
  completed: {
    title: "Booking Completed",
    body: "Your booking has been marked as completed. Please leave a review!",
  },
  canceled: {
    title: "Booking Canceled",
    body: "Your booking has been canceled.",
  },
  refunded: {
    title: "Booking Refunded",
    body: "Your booking has been refunded.",
  },
}

export async function notifyBookingStatusChange(
  bookingId: string,
  customerId: string,
  _providerId: string | null,
  newStatus: string,
  providerName: string,
) {
  const message = TRANSITION_MESSAGES[newStatus]
  if (!message) return

  const notification = await notificationService.create({
    user_id: customerId,
    type: "booking",
    title: message.title,
    body: `${providerName}: ${message.body}`,
    data: { bookingId, status: newStatus },
  })

  try {
    const supabase = getSupabaseServerClient()
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", customerId)
      .maybeSingle()

    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: `${message.title} - Leish!`,
        html: `
          <h2>${message.title}</h2>
          <p>Hi ${profile.full_name || "there"},</p>
          <p>${message.body}</p>
          <p><strong>Provider:</strong> ${providerName}</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/account">View in your account</a></p>
        `,
        text: `${message.title}\n\nHi ${profile.full_name || "there"},\n\n${message.body}\n\nProvider: ${providerName}`,
      })
    }
  } catch (error) {
    console.error("[booking-notifications] email send failed:", error)
  }

  return notification
}

export async function notifyNewBookingToProvider(
  providerId: string,
  customerName: string,
  bookingId: string,
) {
  const supabase = getSupabaseServerClient()
  const { data: provider } = await supabase
    .from("providers")
    .select("owner_id, display_name")
    .eq("id", providerId)
    .maybeSingle()

  if (!provider) return

  await notificationService.create({
    user_id: provider.owner_id,
    type: "booking",
    title: "New Booking Received",
    body: `${customerName} has booked ${provider.display_name}.`,
    data: { bookingId },
  })

  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", provider.owner_id)
      .maybeSingle()

    if (profile?.email) {
      await sendEmail({
        to: profile.email,
        subject: "New Booking Received! - Leish!",
        html: `
          <h2>New Booking!</h2>
          <p>You've received a new booking from <strong>${customerName}</strong>.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || "https://www.leish.my"}/artist/bookings">View booking</a></p>
        `,
        text: `New booking from ${customerName}. View it in your dashboard.`,
      })
    }
  } catch (error) {
    console.error("[booking-notifications] provider email failed:", error)
  }
}
