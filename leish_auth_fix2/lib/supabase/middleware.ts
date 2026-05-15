import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { type NextRequest, NextResponse } from "next/server"

const CANONICAL_ORIGIN = "https://www.leish.my"

function applyCorsHeaders(response: NextResponse) {
  response.headers.set("Access-Control-Allow-Origin", CANONICAL_ORIGIN)
  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS")
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
  return response
}

export function updateSession(request: NextRequest) {
  let supabaseResponse = applyCorsHeaders(NextResponse.next({
    request: { headers: request.headers },
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
      setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        supabaseResponse = applyCorsHeaders(NextResponse.next({ request }))
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options as CookieOptions)
        )
      },
    },
  })

  // IMPORTANT: do not add any logic between createServerClient and getUser()
  // Refresh session — must be called for cookies to be written
  void supabase.auth.getUser()

  return supabaseResponse
}
