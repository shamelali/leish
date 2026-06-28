import { auth } from "./next-auth.server"
import { type NextRequest, NextResponse } from "next/server"

const PUBLIC_PATHS = [
  "/sign-in",
  "/sign-in/mfa",
  "/sign-up",
  "/auth",
  "/forgot-password",
  "/api/auth",
  "/_next",
  "/images",
  "/favicon",
]

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p))
}

const PROTECTED_PATHS = ["/account", "/admin", "/artist", "/studio"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((p) =>
    pathname === p || pathname.startsWith(p + "/")
  )
}

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl
  const session = await auth()
  const response = NextResponse.next({ request: { headers: request.headers } })

  if (session?.user?.id) {
    response.cookies.set("session-user-id", session.user.id, {
      domain: ".leish.my",
      path: "/",
      sameSite: "lax",
      secure: true,
      httpOnly: true,
    })
  }

  // MFA enforcement for protected paths
  if (isProtectedPath(pathname) && session?.user) {
    const mfaEnabled = (session.user as any)?.mfaEnabled
    const mfaVerified = (session.user as any)?.mfaVerified
    if (mfaEnabled && !mfaVerified) {
      const mfaUrl = new URL("/sign-in/mfa", request.url)
      return NextResponse.redirect(mfaUrl)
    }
  }

  return response
}

export { auth }
