import { type NextRequest, NextResponse } from "next/server"

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const response = NextResponse.next({ request: { headers: request.headers } })
  response.headers.set("X-Request-ID", requestId)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
