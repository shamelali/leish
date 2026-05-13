import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"

type ReviewPayload = {
  bookingId: string
  providerId: string
  authorId: string
  rating: number
  title?: string
  body: string
}

export async function POST(req: Request) {
  let payload: ReviewPayload
  try {
    payload = (await req.json()) as ReviewPayload
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (payload.rating < 1 || payload.rating > 5) {
    return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 })
  }

  try {
    const sql = getSql()
    const rows = await sql<{ id: string }[]>`
      insert into public.reviews (
        booking_id, provider_id, author_id, rating, title, body, status
      ) values (
        ${payload.bookingId},
        ${payload.providerId},
        ${payload.authorId},
        ${payload.rating},
        ${payload.title ?? null},
        ${payload.body},
        'published'
      )
      returning id
    `

    return NextResponse.json({ ok: true, reviewId: rows[0].id }, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create review"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

