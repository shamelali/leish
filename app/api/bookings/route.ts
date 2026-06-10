import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { bookingSupabaseService } from "@/lib/services/booking-supabase";
import { notificationService } from "@/lib/services/notifications";
import {
  sendBookingConfirmationSms,
  sendBookingCancellationSms,
} from "@/lib/services/booking-notifications";
import { enforceRateLimit } from "@/lib/ops/rate-limit";
import { reportApiError } from "@/lib/ops/alerts";
import { createEvent, deleteEvent } from "@/lib/services/google-calendar";
import { surchargeService } from "@/lib/services/surcharges";
import { calcTravelFee } from "@/lib/services/maps";

interface BookingPayload {
  customerId: string;
  providerId: string;
  serviceId: string;
  slotId: string;
  notes?: string;
  address?: string;
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

    // Notify provider of new booking
    try {
      const provider = await bookingSupabaseService.getById(booking.id);
      if (provider) {
        const sb = getSupabaseServerClient();
        const { data: provProfile } = await sb
          .from("providers")
          .select("owner_id")
          .eq("id", provider.provider_id)
          .maybeSingle();

        if (provProfile?.owner_id) {
          await notificationService.create({
            user_id: provProfile.owner_id,
            type: "booking",
            title: "New booking received",
            body: `A new booking (${booking.id.slice(0, 8)}…) has been created and is awaiting your confirmation.`,
            data: { bookingId: booking.id, status: "pending" },
          });
        }
      }
    } catch {
      console.error("Provider notification failed for booking:", booking.id);
    }

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

    // Apply travel fee surcharge if address was provided
    if (payload.address) {
      try {
        const travelFeeResult = await calcTravelFee(payload.address, payload.providerId);
        if (travelFeeResult && travelFeeResult.fee > 0) {
          await surchargeService.applySurchargesToBooking(booking.id, [
            {
              name: "Travel Fee",
              amountMyr: Math.round(travelFeeResult.fee),
              reason: `${travelFeeResult.distanceKm.toFixed(1)} km from provider`,
            },
          ]);
        }
      } catch (surchargeError) {
        console.error("Travel fee surcharge failed for booking:", booking.id, surchargeError);
      }
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

async function syncBookingToCalendar(booking: any, supabase: any) {
  const [service, profile, provider] = await Promise.all([
    supabase.from("services").select("name").eq("id", booking.service_id).maybeSingle().then((r: any) => r.data),
    supabase.from("profiles").select("full_name").eq("id", booking.customer_id).maybeSingle().then((r: any) => r.data),
    supabase.from("providers").select("display_name").eq("id", booking.provider_id).maybeSingle().then((r: any) => r.data),
  ])
  if (!service || !profile || !provider) return
  const customerName = profile.full_name || "Customer"

  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
  const { data: authUser } = await serviceClient.auth.admin.getUserById(booking.customer_id)
  const customerEmail = authUser?.user?.email || ""

  const start = new Date(booking.scheduled_at)
  const end = new Date(start.getTime() + 30 * 60 * 1000)

  const eventId = await createEvent({
    summary: `${service.name} – ${customerName} @ ${provider.display_name}`,
    description: `Booking ID: ${booking.id}\nCustomer: ${customerName} (${customerEmail})`,
    start: start.toISOString(),
    end: end.toISOString(),
    attendees: customerEmail ? [customerEmail] : undefined,
  })

  await supabase.from("bookings").update({ google_calendar_event_id: eventId }).eq("id", booking.id)
}

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient();
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
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

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
        // Remove from Google Calendar
        if (booking.google_calendar_event_id) {
          try {
            await deleteEvent(booking.google_calendar_event_id);
          } catch {
            console.error("Google Calendar delete failed for booking:", booking.id);
          }
        }
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
        // Remove old event from Google Calendar
        if (booking.google_calendar_event_id) {
          try {
            await deleteEvent(booking.google_calendar_event_id);
          } catch {
            console.error("Google Calendar delete failed for rescheduled booking:", booking.id);
          }
        }
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
      const actionLabels: Record<string, string> = {
        confirm: "confirmed",
        complete: "completed",
        cancel: "canceled",
        refund: "refunded",
      };
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

      // Send confirmation SMS when provider confirms booking
      if (sendConfirmSms) {
        try {
          await sendBookingConfirmationSms(booking.id);
        } catch {
          console.error("SMS confirmation failed for booking:", booking.id);
        }
      }

      // Sync confirmed booking to Google Calendar
      if (nextStatus === "confirmed") {
        try {
          await syncBookingToCalendar(booking, supabase);
        } catch {
          console.error("Google Calendar sync failed for booking:", booking.id);
        }
      }

      // Send in-app notification to customer
      if (nextStatus !== "refunded") {
        try {
          const label = actionLabels[nextStatus] || nextStatus;
          await notificationService.create({
            user_id: booking.customer_id,
            type: "booking",
            title: `Booking ${label}`,
            body: `Your booking ${booking.id.slice(0, 8)}… has been ${label} by the provider.`,
            data: { bookingId: booking.id, status: nextStatus },
          });
        } catch {
          console.error("In-app notification failed for booking:", booking.id);
        }
      }

      // Remove from Google Calendar on cancel
      if (nextStatus === "canceled" && booking.google_calendar_event_id) {
        try {
          await deleteEvent(booking.google_calendar_event_id);
        } catch {
          console.error("Google Calendar delete failed for booking:", booking.id);
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
