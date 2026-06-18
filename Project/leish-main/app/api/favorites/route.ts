import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"
import { getUser } from "@/lib/services/db"

export async function GET() {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const sql = getSql()
    const favorites = await sql<{
      id: string
      provider_id: string
      created_at: string
      slug: string
      display_name: string
      state: string
      district: string
      image: string
      hourly_rate: number
      rating: number
      review_count: number
    }[]>`
      select 
        f.id,
        f.provider_id,
        f.created_at,
        p.slug,
        p.display_name,
        p.state,
        p.district,
        p.image,
        p.hourly_rate,
        p.rating,
        p.review_count
      from public.favorites f
      join public.providers p on p.id = f.provider_id
      where f.customer_id = ${user.id}
      order by f.created_at desc
    `

    return NextResponse.json({ favorites })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch favorites"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { providerId: string }
  try {
    payload = (await req.json()) as { providerId: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!payload.providerId) {
    return NextResponse.json({ error: "providerId is required" }, { status: 400 })
  }

  try {
    const sql = getSql()
    await sql`
      insert into public.favorites (customer_id, provider_id)
      values (${user.id}, ${payload.providerId})
      on conflict (customer_id, provider_id) do nothing
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add favorite"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let payload: { providerId: string }
  try {
    payload = (await req.json()) as { providerId: string }
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  if (!payload.providerId) {
    return NextResponse.json({ error: "providerId is required" }, { status: 400 })
  }

  try {
    const sql = getSql()
    await sql`
      delete from public.favorites
      where customer_id = ${user.id} and provider_id = ${payload.providerId}
    `

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove favorite"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
