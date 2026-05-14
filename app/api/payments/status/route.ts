import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url)
  const bookingId = url.searchParams.get("bookingId")
  if (!bookingId) {
    return NextResponse.json({ error: "Missing bookingId" }, { status: 400 })
  }

  const sql = getSql()
  const bookingRows = await sql<
    { id: string; customer_id: string; provider_id: string; status: string }[]
  >`
    select id, customer_id, provider_id, status::text as status
    from public.bookings
    where id = ${bookingId}
    limit 1
  `
  const booking = bookingRows[0]
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 })
  }

  if (booking.customer_id !== user.id) {
    const [{ owner_id: ownerId } = { owner_id: null as string | null }] = await sql<
      { owner_id: string | null }[]
    >`
      select owner_id from public.providers where id = ${booking.provider_id} limit 1
    `
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()
    const isAdmin = profile?.role === "admin"
    const isOwner = ownerId === user.id
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 })
    }
  }

  const paymentRows = await sql<
    { status: string | null; payment_intent_id: string | null; updated_at: string | null }[]
  >`
    select status::text as status, payment_intent_id, updated_at::text as updated_at
    from public.payments
    where booking_id = ${bookingId}
      and provider = 'billplz'
    order by updated_at desc nulls last
    limit 1
  `
  const payment = paymentRows[0] ?? null

  return NextResponse.json({
    ok: true,
    bookingStatus: booking.status,
    paymentStatus: payment?.status ?? null,
    paymentIntentId: payment?.payment_intent_id ?? null,
    paymentUpdatedAt: payment?.updated_at ?? null,
  })
}

