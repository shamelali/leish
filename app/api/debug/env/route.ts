import { NextResponse } from "next/server"

// This endpoint has been disabled.
export async function GET() {
  return NextResponse.json({ ok: false }, { status: 404 })
}
