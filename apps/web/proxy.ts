import { NextResponse, type NextRequest } from "next/server"
import { corsHeaders, isAllowedOrigin } from "@/lib/ops/cors"

/**
 * Applies the CORS allowlist to /api/* (see lib/ops/cors.ts).
 * Same-origin requests carry no cross-origin Origin and pass through untouched.
 */
export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin")
  const allowed = isAllowedOrigin(origin)

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: allowed ? 204 : 403,
      headers: allowed && origin ? corsHeaders(origin) : { Vary: "Origin" },
    })
  }

  const res = NextResponse.next()
  if (allowed && origin) {
    for (const [k, v] of Object.entries(corsHeaders(origin))) res.headers.set(k, v)
  }
  return res
}

export const config = {
  matcher: "/api/:path*",
}
