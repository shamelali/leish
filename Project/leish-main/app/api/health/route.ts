import { NextResponse } from "next/server"
import { checkDatabaseHealth } from "@/lib/db/postgres"

export async function GET() {
  try {
    const health = await checkDatabaseHealth()
    return NextResponse.json(health, { status: 200 })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}

