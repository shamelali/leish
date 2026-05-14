/**
 * Booking notification service
 *
 * Sends WhatsApp notifications after booking events.
 * Uses Supabase to fetch booking details, then sends via WhatsApp Cloud API.
 */
import { createClient } from "@supabase/supabase-js";
import {
  sendBookingConfirmation,
  sendCancellationNotice,
} from "@/lib/notifications/whatsapp";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getServiceClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

async function fetchBookingDetails(bookingId: string) {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      total_amount_myr,
      notes,
      customer_id,
      provider_id,
      service_id,
      slot_id,
      created_at,
      services!inner (name, duration_minutes),
      providers!inner (display_name),
      availability_slots!inner (starts_at),
      customer:profiles!customer_id (full_name, email, phone)
    `,
    )
    .eq("id", bookingId)
    .single();

  if (error || !data) return null;

  // Supabase relations return arrays for joined tables
  const customer = Array.isArray(data.customer)
    ? data.customer[0]
    : data.customer;
  const service = Array.isArray(data.services)
    ? data.services[0]
    : data.services;
  const provider = Array.isArray(data.providers)
    ? data.providers[0]
    : data.providers;
  const slot = Array.isArray(data.availability_slots)
    ? data.availability_slots[0]
    : data.availability_slots;

  if (!customer || !service || !provider || !slot) return null;

  return {
    id: data.id,
    customerName: customer.full_name || "Valued Customer",
    customerPhone: customer.phone,
    customerEmail: customer.email,
    serviceName: service.name,
    providerName: provider.display_name,
    date: new Date(slot.starts_at).toLocaleDateString("en-MY", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    time: new Date(slot.starts_at).toLocaleTimeString("en-MY", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: data.status,
  };
}

export async function sendBookingConfirmationSms(bookingId: string) {
  const details = await fetchBookingDetails(bookingId);
  if (!details?.customerPhone) {
    return { success: false, reason: "No phone number" };
  }

  try {
    const result = await sendBookingConfirmation({
      customerName: details.customerName,
      bookingId: details.id,
      serviceName: details.serviceName,
      providerName: details.providerName,
      date: details.date,
      time: details.time,
      phone: details.customerPhone,
    });

    // Log the notification event
    const supabase = getServiceClient();
    if (supabase && result.success) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "whatsapp_confirmation_sent",
        event_payload: { messageId: result.messageId },
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to send booking confirmation WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendBookingCancellationSms(bookingId: string) {
  const details = await fetchBookingDetails(bookingId);
  if (!details?.customerPhone) {
    return { success: false, reason: "No phone number" };
  }

  try {
    const result = await sendCancellationNotice({
      customerName: details.customerName,
      bookingId: details.id,
      phone: details.customerPhone,
    });

    // Log the notification event
    const supabase = getServiceClient();
    if (supabase && result.success) {
      await supabase.from("booking_events").insert({
        booking_id: bookingId,
        event_type: "whatsapp_cancellation_sent",
        event_payload: { messageId: result.messageId },
      });
    }

    return result;
  } catch (error) {
    console.error("Failed to send cancellation WhatsApp:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
