import { NextResponse } from "next/server";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { bookingSupabaseService } from "@/lib/services/booking-supabase";
import {
  sendBookingConfirmationSms,
  sendBookingCancellationSms,
} from "@/lib/services/booking-notifications";
import { sendEmail } from "@/lib/email/resend";
import { bookingConfirmationTemplate } from "@/lib/email/templates";
import { enforceRateLimit } from "@/lib/ops/rate-limit";
import { reportApiError } from "@/lib/ops/alerts";

interface BookingPayload {
  customerId: string;
  providerId: string;
  serviceId: string;
  slotId: string;
  notes?: string;
  totalAmountMyr: number;
}

interface PatchPayload {
  bookingId: string;
  action: "confirm" | "cancel" | "complete" | "refund" | "reschedule";
  slotId?: string;
}

export async function POST(req: Request) {
  const limit = enforceRateLimit(req, "bookings:create", 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: "Too many booking attempts. Please try again shortly.",
      },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let payload: BookingPayload;
  try {
    payload = (await req.json()) as BookingPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload" },
      { status: 400 },
    );
  }

  try {
    // Resolve service ID by name or UUID
    const resolvedServiceId = await bookingSupabaseService.resolveServiceId(
      payload.providerId,
      payload.serviceId,
    );
    if (!resolvedServiceId) {
      return NextResponse.json(
        { ok: false, error: "Service not found for provider" },
        { status: 400 },
      );
    }

    const booking = await bookingSupabaseService.create({
      ...payload,
      serviceId: resolvedServiceId,
    });

    // Send SMS/WhatsApp confirmation (non-blocking, won't fail booking if SMS fails)
    try {
      await sendBookingConfirmationSms(booking.id);
    } catch (smsError) {
      console.error(
        "SMS confirmation failed for booking:",
        booking.id,
        smsError,
      );
      // Don't fail the booking if SMS fails
    }

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    await reportApiError("bookings_post", error, {
      providerId: payload?.providerId ?? null,
    });
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile?.role === "admin";
  const url = new URL(req.url);
  const providerId = url.searchParams.get("providerId");

  try {
    const rows = await bookingSupabaseService.listByUser(
      user.id,
      isAdmin,
      providerId,
    );
    return NextResponse.json(rows);
  } catch (error) {
    await reportApiError("bookings_get", error, { userId: user.id });
    return NextResponse.json(
      { error: "Failed to fetch bookings" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient();
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let payload: PatchPayload;
  try {
    payload = (await req.json()) as PatchPayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  try {
    // Fetch booking to enforce auth
    const booking = await bookingSupabaseService.getById(payload.bookingId);
    if (!booking) throw new Error("Booking not found");

    // check permissions
    const { data: prov } = await supabase
      .from("providers")
      .select("owner_id")
      .eq("id", booking.provider_id)
      .maybeSingle();

    const isOwner = prov?.owner_id === user.id;
    const { data: profile2 } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const isAdmin2 = profile2?.role === "admin";

    // customer allowed actions
    if (booking.customer_id === user.id) {
      if (payload.action === "cancel") {
        await bookingSupabaseService.transition(booking.id, "canceled");
        // Send cancellation SMS
        try {
          await sendBookingCancellationSms(booking.id);
        } catch {
          console.error(
            "SMS cancellation notification failed for booking:",
            booking.id,
          );
        }
        return NextResponse.json({ ok: true });
      }
      if (payload.action === "reschedule" && payload.slotId) {
        // naive reschedule: cancel and create new booking
        await bookingSupabaseService.transition(booking.id, "canceled");
        const newBooking = await bookingSupabaseService.create({
          customerId: booking.customer_id,
          providerId: booking.provider_id,
          serviceId: booking.service_id,
          slotId: payload.slotId,
          totalAmountMyr: booking.total_amount_myr,
        });
        // Send confirmation for new booking
        try {
          await sendBookingConfirmationSms(newBooking.id);
        } catch {
          console.error(
            "SMS confirmation failed for rescheduled booking:",
            newBooking.id,
          );
        }
        return NextResponse.json({ ok: true });
      }
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    // provider or admin
    if (isOwner || isAdmin2) {
      let nextStatus = "";
      let sendConfirmSms = false;
      switch (payload.action) {
        case "confirm":
          nextStatus = "confirmed";
          sendConfirmSms = true;
          break;
        case "complete":
          nextStatus = "completed";
          break;
        case "refund":
          nextStatus = "refunded";
          break;
        case "cancel":
          nextStatus = "canceled";
          break;
      }
      if (!nextStatus) {
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
      }
      await bookingSupabaseService.transition(booking.id, nextStatus);

      // Send confirmation email when provider confirms booking
      if (sendConfirmSms) {
        try {
          await sendBookingConfirmationSms(booking.id);
        } catch {
          console.error("SMS confirmation failed for booking:", booking.id);
        }
          try {
            const { data: customer } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", booking.customer_id)
              .maybeSingle();
            const { data: provider } = await supabase
              .from("providers")
              .select("display_name")
              .eq("id", booking.provider_id)
              .maybeSingle();
            const { data: service } = await supabase
              .from("services")
              .select("name")
              .eq("id", booking.service_id)
              .maybeSingle();
            if (customer) {
              const emailContent = bookingConfirmationTemplate({
                customerName: customer.full_name || "Valued Customer",
                bookingId: booking.id.slice(0, 8),
                serviceName: service?.name || "Service",
                providerName: provider?.display_name || "Provider",
                date: new Date().toLocaleDateString("en-MY"),
                time: "Scheduled",
                amount: booking.total_amount_myr || 0,
                paymentType: "full",
              });
              await sendEmail({
                to: booking.customer_email || "",
                ...emailContent,
              });
            }
          } catch (emailErr) {
            console.error("Confirmation email failed:", emailErr);
          }
      }

      // Send completion email
      if (nextStatus === "completed") {
        try {
          const { data: customer } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", booking.customer_id)
            .maybeSingle();
          if (customer) {
            await sendEmail({
              to: booking.customer_email || "",
              subject: `Booking Completed - ${booking.id.slice(0, 8)}`,
              html: `<h2>Booking Completed</h2><p>Hi ${customer.full_name},</p><p>Your booking has been marked as completed. Thank you for choosing Leish! We hope you had a great experience.</p><p><a href="https://www.leish.my/bookings">Leave a Review</a></p>`,
              text: `Booking Completed\n\nHi ${customer.full_name},\n\nYour booking has been marked as completed. Thank you for choosing Leish!\n\nLeave a review: https://www.leish.my/bookings`,
            });
          }
        } catch (emailErr) {
          console.error("Completion email failed:", emailErr);
        }
      }

      // Send cancellation SMS
      if (nextStatus === "canceled") {
        try {
          await sendBookingCancellationSms(booking.id);
        } catch {
          console.error(
            "SMS cancellation notification failed for booking:",
            booking.id,
          );
        }
      }

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
