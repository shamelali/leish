import { NextRequest, NextResponse } from "next/server"
import {
  checkLoginBlocked,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/ops/rate-limit"

function getRequestIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "email query parameter required" }, { status: 400 })
  }

  const ip = getRequestIp(req)
  const result = checkLoginBlocked(ip, email)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req)
  const body = await req.json()
  const { action, email } = body

  if (!email) {
    return NextResponse.json({ error: "email field required" }, { status: 400 })
  }

  switch (action) {
    case "record":
      recordFailedLoginAttempt(ip, email)
      return NextResponse.json({ ok: true })
    case "clear":
      clearLoginAttempts(ip, email)
      return NextResponse.json({ ok: true })
    default:
      return NextResponse.json({ error: "action must be 'record' or 'clear'" }, { status: 400 })
  }
}
