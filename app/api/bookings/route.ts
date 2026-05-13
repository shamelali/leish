import { NextResponse } from "next/server";
import { getSupabaseSsrClient } from "@/lib/supabase/ssr";
import { bookingSupabaseService } from "@/lib/services/booking-supabase";
import {
  sendBookingConfirmationSms,
  sendBookingCancellationSms,
} from "@/lib/services/booking-notifications";
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

      // Send confirmation SMS when provider confirms booking
      if (sendConfirmSms) {
        try {
          await sendBookingConfirmationSms(booking.id);
        } catch {
          console.error("SMS confirmation failed for booking:", booking.id);
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
