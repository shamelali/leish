import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/postgres";
import { verifyBillplzXSignature } from "@/lib/payments/billplz";
import { enforceRateLimit } from "@/lib/ops/rate-limit";
import { reportApiError } from "@/lib/ops/alerts";
import { sendEmail } from "@/lib/email/brevo";
import {
  bookingConfirmationTemplate,
  paymentReceiptTemplate,
} from "@/lib/email/templates";
import { sendPaymentConfirmation } from "@/lib/notifications/whatsapp";

function getValue(params: URLSearchParams, key: string) {
  return params.get(key) ?? params.get(`billplz[${key}]`) ?? undefined;
}

export async function POST(req: Request) {
  const limit = enforceRateLimit(req, "payments:billplz:webhook", 120, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Webhook rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  const signature = req.headers.get("x-signature") ?? "";
  const rawBody = await req.text();

  if (!signature || !verifyBillplzXSignature(rawBody, signature)) {
    await reportApiError("billplz_webhook_signature", "Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const params = new URLSearchParams(rawBody);
  const billId = getValue(params, "id");
  const paid = getValue(params, "paid") === "true";
  const amount = Number(getValue(params, "paid_amount") ?? "0") / 100;
  const bookingId = getValue(params, "reference_1");
  const paymentType = (getValue(params, "reference_2") ?? "full") as
    | "full"
    | "deposit";

  if (!billId || !bookingId) {
    return NextResponse.json({ error: "Missing identifiers" }, { status: 400 });
  }

  try {
    const sql = getSql();
    const existingPayment = await sql<{ status: string | null }[]>`
      select status::text as status
      from public.payments
      where payment_intent_id = ${billId}
      limit 1
    `;
    const previousStatus = existingPayment[0]?.status ?? null;
    const isDuplicateSuccess = paid && previousStatus === "succeeded";
    const nextPaymentStatus =
      previousStatus === "succeeded"
        ? "succeeded"
        : paid
          ? "succeeded"
          : "failed";

    await sql`
      update public.payments
      set status = ${nextPaymentStatus}::public.payment_status,
          amount_myr = ${Math.round(amount)},
          webhook_payload = ${JSON.stringify(Object.fromEntries(params.entries()))}::jsonb,
          updated_at = now()
      where payment_intent_id = ${billId}
    `;

    if (paid && !isDuplicateSuccess) {
      const nextBookingStatus =
        paymentType === "deposit" ? "paid_deposit" : "paid_full";
      await sql`
        update public.bookings
        set status = ${nextBookingStatus}::public.booking_status,
            paid_amount_myr = greatest(coalesce(paid_amount_myr, 0), 0) + ${Math.round(amount)},
            updated_at = now()
        where id = ${bookingId}
      `;

      // Fetch booking details and send confirmation email
      try {
        const bookingDetails = await sql<
          {
            customer_email: string;
            customer_name: string;
            service_name: string;
            provider_name: string;
            booking_date: string;
            booking_time: string;
            customer_phone: string;
          }[]
        >`
          select
            b.customer_id,
            p.email as customer_email,
            p.full_name as customer_name,
            p.phone as customer_phone,
            s.name as service_name,
            pr.display_name as provider_name,
            to_char(aslot.starts_at, 'YYYY-MM-DD') as booking_date,
            to_char(aslot.starts_at, 'HH24:MI') as booking_time
          from public.bookings b
          left join public.profiles p on p.id = b.customer_id
          left join public.providers pr on pr.id = b.provider_id
          left join public.services s on s.id = b.service_id
          left join public.availability_slots aslot on aslot.id = b.slot_id
          where b.id = ${bookingId}
          limit 1
        `;

        const booking = bookingDetails[0];
        if (booking?.customer_email) {
          // Send booking confirmation
          const confirmationTemplate = bookingConfirmationTemplate({
            customerName: booking.customer_name || "Customer",
            bookingId: bookingId,
            serviceName: booking.service_name || "Service",
            providerName: booking.provider_name || "Provider",
            date: booking.booking_date || "",
            time: booking.booking_time || "",
            amount: Math.round(amount),
            paymentType: paymentType,
          });

          await sendEmail({
            to: booking.customer_email,
            subject: confirmationTemplate.subject,
            html: confirmationTemplate.html,
            text: confirmationTemplate.text,
          });

          // Send payment receipt
          const receiptTemplate = paymentReceiptTemplate({
            customerName: booking.customer_name || "Customer",
            bookingId: bookingId,
            amount: Math.round(amount),
            paymentMethod: "Billplz",
            date: new Date().toLocaleDateString("en-MY"),
          });

          await sendEmail({
            to: booking.customer_email,
            subject: receiptTemplate.subject,
            html: receiptTemplate.html,
            text: receiptTemplate.text,
          });

          // Send WhatsApp payment confirmation
          try {
            if (booking.customer_phone) {
              await sendPaymentConfirmation({
                customerName: booking.customer_name || "Customer",
                bookingId: bookingId,
                amount: Math.round(amount),
                phone: booking.customer_phone,
              });
            }
          } catch (smsError) {
            console.error("Failed to send payment WhatsApp:", smsError);
          }
        }
      } catch (emailError) {
        // Log email error but don't fail the webhook
        console.error("Failed to send confirmation email:", emailError);
        await reportApiError("payment_confirmation_email", emailError, {
          bookingId,
        });
      }
    }

    await sql`
      insert into public.booking_events (booking_id, event_type, event_payload)
      values (
        ${bookingId},
        ${
          isDuplicateSuccess
            ? "payment_duplicate_ignored"
            : paid
              ? paymentType === "deposit"
                ? "payment_deposit_succeeded"
                : "payment_full_succeeded"
              : "payment_failed"
        },
        ${JSON.stringify(Object.fromEntries(params.entries()))}::jsonb
      )
    `;

    return NextResponse.json({
      ok: true,
      duplicateIgnored: isDuplicateSuccess,
    });
  } catch (error) {
    await reportApiError("billplz_webhook", error, {
      bookingId: bookingId ?? null,
      billId: billId ?? null,
    });
    const message = error instanceof Error ? error.message : "Webhook failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
