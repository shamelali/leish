import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db/postgres"

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = getSql()
  const results: { cleaned: number; message: string }[] = []

  try {
    // Clean up old expired availability slots (older than 7 days, not booked)
    const slotsResult = await sql`
      delete from public.availability_slots
      where is_booked = false
        and starts_at < now() - interval '7 days'
      returning id
    `
    results.push({ cleaned: slotsResult.count || 0, message: "Expired availability slots" })

    // Clean up old audit logs (older than 90 days)
    const logsResult = await sql`
      delete from public.admin_audit_log
      where created_at < now() - interval '90 days'
      returning id
    `
    results.push({ cleaned: logsResult.count || 0, message: "Old audit logs" })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Cron cleanup error:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 })
  }
}
