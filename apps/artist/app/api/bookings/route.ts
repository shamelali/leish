import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr";
import { getSupabaseServerClient } from "@leish/shared/lib/auth/server";
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

async function notifyProviderOnBooking(bookingId: string) {
  try {
    const provider = await bookingSupabaseService.getById(bookingId);
    if (provider) {
      const sb = getSupabaseServerClient();
      const { data: provProfile } = await sb.from("providers").select("owner_id").eq("id", provider.provider_id).maybeSingle();
      if (provProfile?.owner_id) {
        await notificationService.create({
          user_id: provProfile.owner_id, type: "booking",
          title: "New booking received",
          body: `A new booking (${bookingId.slice(0, 8)}…) has been created and is awaiting your confirmation.`,
          data: { bookingId, status: "pending" },
        });
      }
    }
  } catch { console.error("Provider notification failed for booking:", bookingId); }
}

async function applyTravelFee(address: string, providerId: string, bookingId: string) {
  try {
    const travelFeeResult = await calcTravelFee(address, providerId);
    if (travelFeeResult && travelFeeResult.fee > 0) {
      await surchargeService.applySurchargesToBooking(bookingId, [{
        name: "Travel Fee", amountMyr: Math.round(travelFeeResult.fee),
        reason: `${travelFeeResult.distanceKm.toFixed(1)} km from provider`,
      }]);
    }
  } catch (e) {
    console.error("Travel fee surcharge failed for booking:", bookingId, e);
  }
}

export async function POST(req: Request) {
  const limit = await enforceRateLimit(req, "bookings:create", 20, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many booking attempts. Please try again shortly." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let payload: BookingPayload;
  try { payload = (await req.json()) as BookingPayload; }
  catch { return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 }); }

  try {
    const resolvedServiceId = await bookingSupabaseService.resolveServiceId(payload.providerId, payload.serviceId);
    if (!resolvedServiceId) {
      return NextResponse.json({ ok: false, error: "Service not found for provider" }, { status: 400 });
    }

    const booking = await bookingSupabaseService.create({ ...payload, serviceId: resolvedServiceId });
    notifyProviderOnBooking(booking.id);
    try { await sendBookingConfirmationSms(booking.id); } catch (e) { console.error("SMS failed:", booking.id, e); }
    if (payload.address) { applyTravelFee(payload.address, payload.providerId, booking.id); }

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (error) {
    await reportApiError("bookings_post", error, { providerId: payload?.providerId ?? null });
    const message = error instanceof Error ? error.message : "Booking failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const isAdmin = profile?.role === "admin";
  const url = new URL(req.url);
  const providerId = url.searchParams.get("providerId");

  try {
    const rows = await bookingSupabaseService.listByUser(user.id, isAdmin, providerId);
    return NextResponse.json(rows);
  } catch (error) {
    await reportApiError("bookings_get", error, { userId: user.id });
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

async function syncBookingToCalendar(booking: Record<string, unknown>, supabase: any) {
  const [service, profile, provider] = await Promise.all([
    supabase.from("services").select("name").eq("id", booking.service_id).maybeSingle().then((r: any) => r.data),
    supabase.from("profiles").select("full_name").eq("id", booking.customer_id).maybeSingle().then((r: any) => r.data),
    supabase.from("providers").select("display_name").eq("id", booking.provider_id).maybeSingle().then((r: any) => r.data),
  ]);
  if (!service || !profile || !provider) return;
  const customerName = (profile as { full_name?: string }).full_name || "Customer";
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: authUser } = await serviceClient.auth.admin.getUserById(booking.customer_id as string);
  const customerEmail = authUser?.user?.email || "";
  const start = new Date(booking.scheduled_at as string);
  const end = new Date(start.getTime() + 30 * 60 * 1000);
  const eventId = await createEvent({
    summary: `${(service as { name: string }).name} – ${customerName} @ ${(provider as { display_name: string }).display_name}`,
    description: `Booking ID: ${booking.id}\nCustomer: ${customerName} (${customerEmail})`,
    start: start.toISOString(), end: end.toISOString(),
    attendees: customerEmail ? [customerEmail] : undefined,
  });
  await supabase.from("bookings").update({ google_calendar_event_id: eventId }).eq("id", booking.id as string);
}

async function handleCustomerCancel(booking: Record<string, unknown>) {
  await bookingSupabaseService.transition(booking.id as string, "canceled");
  if (booking.google_calendar_event_id) {
    try { await deleteEvent(booking.google_calendar_event_id as string); } catch {}
  }
  try { await sendBookingCancellationSms(booking.id as string); } catch {}
  return NextResponse.json({ ok: true });
}

async function handleCustomerReschedule(booking: Record<string, unknown>, payload: PatchPayload) {
  if (booking.google_calendar_event_id) {
    try { await deleteEvent(booking.google_calendar_event_id as string); } catch {}
  }
  await bookingSupabaseService.transition(booking.id as string, "canceled");
  const newBooking = await bookingSupabaseService.create({
    customerId: booking.customer_id as string,
    providerId: booking.provider_id as string,
    serviceId: booking.service_id as string,
    slotId: payload.slotId!,
    totalAmountMyr: booking.total_amount_myr as number,
  });
  try { await sendBookingConfirmationSms(newBooking.id); } catch {}
  return NextResponse.json({ ok: true });
}

async function onBookingConfirmed(booking: Record<string, unknown>, supabase: any) {
  try { await syncBookingToCalendar(booking, supabase) } catch {}
  try { await sendBookingConfirmationSms(booking.id as string) } catch {}
}

async function onBookingCanceled(booking: Record<string, unknown>) {
  if (booking.google_calendar_event_id) {
    try { await deleteEvent(booking.google_calendar_event_id as string) } catch {}
  }
  try { await sendBookingCancellationSms(booking.id as string) } catch {}
}

async function onBookingTransition(booking: Record<string, unknown>, nextStatus: string) {
  if (nextStatus === "refunded") return
  try {
    await notificationService.create({
      user_id: booking.customer_id as string, type: "booking",
      title: `Booking ${nextStatus}`,
      body: `Your booking ${(booking.id as string).slice(0, 8)}… has been ${nextStatus} by the provider.`,
      data: { bookingId: booking.id, status: nextStatus },
    })
  } catch {}
}

async function handleProviderAction(booking: Record<string, unknown>, payload: PatchPayload, supabase: any) {
  const statusMap: Record<string, string> = { confirm: "confirmed", complete: "completed", refund: "refunded", cancel: "canceled" }
  const nextStatus = statusMap[payload.action]
  if (!nextStatus) return NextResponse.json({ error: "Unknown action" }, { status: 400 })

  await bookingSupabaseService.transition(booking.id as string, nextStatus)
  onBookingTransition(booking, nextStatus)
  if (nextStatus === "confirmed") { onBookingConfirmed(booking, supabase) }
  if (nextStatus === "canceled") { onBookingCanceled(booking) }

  return NextResponse.json({ ok: true })
}

export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let payload: PatchPayload;
  try { payload = (await req.json()) as PatchPayload; }
  catch { return NextResponse.json({ error: "Invalid payload" }, { status: 400 }); }

  try {
    const booking = await bookingSupabaseService.getById(payload.bookingId);
    if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    const { data: prov } = await supabase.from("providers").select("owner_id").eq("id", (booking as Record<string, unknown>).provider_id).maybeSingle();
    const isOwner = prov?.owner_id === user.id;
    const { data: profile2 } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isAdmin2 = profile2?.role === "admin";

    if ((booking as Record<string, unknown>).customer_id === user.id) {
      if (payload.action === "cancel") return handleCustomerCancel(booking as Record<string, unknown>);
      if (payload.action === "reschedule" && payload.slotId) return handleCustomerReschedule(booking as Record<string, unknown>, payload);
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    if (isOwner || isAdmin2) {
      return handleProviderAction(booking as Record<string, unknown>, payload, supabase);
    }

    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Update failed";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
