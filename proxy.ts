import { type NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

const CANONICAL_ORIGIN = "https://www.leish.my"

function applyCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", CANONICAL_ORIGIN)
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return response
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get("host") || ""
  const pathname = request.nextUrl.pathname

  // Domain-based routing
  const domains = ["leish.my", "app.leish.my", "studio.leish.my"]
  const isLeishDomain = domains.some(d => hostname.includes(d))

  if (isLeishDomain) {
    // studio.leish.my -> /studios
    if (hostname.startsWith("studio.") || hostname === "studio.leish.my") {
      const url = request.nextUrl.clone()
      url.pathname = "/studios" + (pathname === "/" ? "" : pathname)
      return NextResponse.rewrite(url)
    }

    // app.leish.my -> /artists (MUA finder)
    if (hostname.startsWith("app.") || hostname === "app.leish.my") {
      const url = request.nextUrl.clone()
      url.pathname = "/artists" + (pathname === "/" ? "" : pathname)
      return NextResponse.rewrite(url)
    }

    // leish.my, www.leish.my -> Landing page (default) - just continue
  }

  // Session refresh logic
  let supabaseResponse = applyCorsHeaders(NextResponse.next({
    request: {
      headers: request.headers,
    },
  }))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(
        cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>
      ) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = applyCorsHeaders(NextResponse.next({ request }))
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as CookieOptions)
        )
      },
    },
  })

  void supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}