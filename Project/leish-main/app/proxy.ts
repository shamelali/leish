import { type NextRequest, NextResponse } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip password check for gate page, auth, static files, and API routes
  const skipPaths = [
    "/gate",
    "/auth",
    "/api",
    "/_next",
    "/favicon.ico",
    "/sitemap.xml",
    "/robots.txt",
  ]

  const shouldSkip = skipPaths.some((p) => pathname.startsWith(p)) ||
    /\.(svg|png|jpg|jpeg|gif|webp|css|js)$/.test(pathname)

  if (!shouldSkip) {
    const accessCookie = request.cookies.get("leish_access")
    if (accessCookie?.value !== "granted") {
      return NextResponse.redirect(new URL("/gate", request.url))
    }
  }

  return updateSession(request)
}

export const config = {
  matcher: [
    "/((?!auth/callback|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
