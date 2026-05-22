import { NextResponse } from "next/server"

export async function GET() {
  const robotsTxt = `User-agent: *
Allow: /
Sitemap: https://www.leish.my/sitemap.xml

# Disallow admin and API from search
Disallow: /admin
Disallow: /api/
`

  return new NextResponse(robotsTxt, {
    headers: { "Content-Type": "text/plain" },
  })
}
