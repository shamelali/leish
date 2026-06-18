import { NextRequest, NextResponse } from "next/server"
import {
  checkLoginBlocked,
  recordFailedLoginAttempt,
  clearLoginAttempts,
} from "@/lib/ops/rate-limit"
import { z } from "zod"

const querySchema = z.object({
  email: z.string().email(),
})

const postSchema = z.object({
  action: z.enum(["record", "clear"]),
  email: z.string().email(),
})

function getRequestIp(req: NextRequest): string {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

export async function GET(req: NextRequest) {
  const parsed = querySchema.safeParse({
    email: req.nextUrl.searchParams.get("email"),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email parameter", details: parsed.error.errors }, { status: 400 })
  }

  const ip = getRequestIp(req)
  const result = checkLoginBlocked(ip, parsed.data.email)

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = postSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.errors }, { status: 400 })
  }

  const { action, email } = parsed.data

  switch (action) {
    case "record":
      recordFailedLoginAttempt(ip, email)
      return NextResponse.json({ ok: true })
    case "clear":
      clearLoginAttempts(ip, email)
      return NextResponse.json({ ok: true })
  }
}
