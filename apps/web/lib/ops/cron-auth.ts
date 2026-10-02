import { timingSafeEqual } from "node:crypto"
import { NextResponse } from "next/server"

/**
 * Authorize a cron invocation.
 *
 * Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Self-hosted
 * schedulers may send `x-cron-secret: <CRON_SECRET>` instead.
 *
 * Fails closed: when CRON_SECRET is unset the request is rejected, except in
 * local development (NODE_ENV=development) so the routes can be exercised
 * without configuration.
 *
 * Returns a 401/500 response when unauthorized, otherwise `null`.
 */
export function authorizeCron(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === "development") return null
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 })
  }

  const auth = req.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null
  const header = req.headers.get("x-cron-secret")

  if (safeEqual(bearer, secret) || safeEqual(header, secret)) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

function safeEqual(candidate: string | null, secret: string): boolean {
  if (!candidate) return false
  const a = Buffer.from(candidate)
  const b = Buffer.from(secret)
  return a.length === b.length && timingSafeEqual(a, b)
}
