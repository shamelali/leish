import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const APP_DOMAIN = "app.leish.my"
const ROOT_DOMAIN = "leish.my"

type CookieSetParameter = {
  name: string
  value: string
  options?: CookieOptions
}

function createSupabaseClient(request: NextRequest, response: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: CookieSetParameter[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, {
              ...options,
              domain: ".leish.my",
            })
          )
        },
      },
    }
  )
}

export async function middleware(request: NextRequest) {
  const url = request.nextUrl
  const hostname = request.headers.get("host") || ""

  const isAppSubdomain =
    hostname === APP_DOMAIN ||
    hostname === `www.${APP_DOMAIN}` ||
    (process.env.NODE_ENV === "development" && hostname.includes("app.localhost"))

  const isRootDomain =
    hostname === ROOT_DOMAIN ||
    hostname === `www.${ROOT_DOMAIN}` ||
    hostname.includes("localhost")

  const pathname = url.pathname

  if (isAppSubdomain) {
    if (pathname.startsWith("/auth/callback")) {
      return NextResponse.next()
    }

    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createSupabaseClient(request, response)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user && pathname !== "/sign-in" && pathname !== "/register") {
      return NextResponse.redirect(new URL("/sign-in", request.url))
    }

    if (user && (pathname === "/sign-in" || pathname === "/register")) {
      return NextResponse.redirect(new URL("/", request.url))
    }

    const rewriteUrl = new URL(`/app${pathname}${url.search}`, request.url)
    return NextResponse.rewrite(rewriteUrl)
  }

  if (isRootDomain) {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createSupabaseClient(request, response)

    await supabase.auth.getUser()

    if (pathname === "/" || pathname === "/sign-in" || pathname === "/register") {
      return NextResponse.rewrite(new URL(`/home${pathname}${url.search}`, request.url))
    }

    const rewriteUrl = new URL(`/home${pathname}${url.search}`, request.url)
    return NextResponse.rewrite(rewriteUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!api/|_next/|_static/|favicon.ico|images/|.*\\.png$).*)",
  ],
}