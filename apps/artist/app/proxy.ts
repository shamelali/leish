import { type NextRequest } from "next/server"
import { createClient } from "@/utils/supabase/middleware"

export async function proxy(request: NextRequest) {
  const requestId = crypto.randomUUID()
  const response = await createClient(request)
  response.headers.set("X-Request-ID", requestId)
  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
