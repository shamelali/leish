import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@leish/shared/lib/auth/next-auth.server"

const SKIP_PATHS = [
  "/gate", "/auth", "/api", "/_next",
  "/favicon.ico", "/sitemap.xml", "/robots.txt",
]

const PROTECTED_PATHS = ["/account", "/admin", "/artist", "/studio"]

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const { pathname } = request.nextUrl

  const shouldSkip = SKIP_PATHS.some((p) => pathname.startsWith(p)) ||
    /\.(svg|png|jpg|jpeg|gif|webp|css|js)$/.test(pathname)

  if (!shouldSkip) {
    const accessCookie = request.cookies.get("leish_access")
    if (accessCookie?.value !== "granted") {
      return NextResponse.redirect(new URL("/gate", request.url))
    }
  }

  const response = NextResponse.next({ request: { headers: request.headers } })
  response.headers.set("X-Request-ID", requestId)

  const session = await auth()
  if (session?.user?.id) {
    response.cookies.set("session-user-id", session.user.id, {
      domain: ".leish.my",
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    })

    const isProtected = PROTECTED_PATHS.some((p) =>
      pathname === p || pathname.startsWith(p + "/")
    )
    const mfaEnabled = (session.user as any)?.mfaEnabled
    const mfaVerified = (session.user as any)?.mfaVerified

    if (isProtected && mfaEnabled && !mfaVerified) {
      return NextResponse.redirect(new URL("/sign-in/mfa", request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    "/((?!auth/callback|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
