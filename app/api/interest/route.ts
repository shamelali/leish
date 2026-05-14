import { NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, city } = body

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 })
    }

    const sql = getSql()
    
    // Insert interest - use ON CONFLICT to handle duplicates gracefully
    await sql`
      INSERT INTO public.artist_interest (email, city)
      VALUES (${email}, ${city || null})
      ON CONFLICT (email) DO UPDATE SET
        city = COALESCE(EXCLUDED.city, public.artist_interest.city),
        updated_at = NOW()
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Interest signup error:", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.json({ error: "Failed to sign up" }, { status: 500 })
  }
}