import { NextResponse } from "next/server"

const SITE_URL = "https://www.leish.my"

export async function GET() {
  const pages = [
    { loc: "/", priority: "1.0" },
    { loc: "/artists", priority: "0.9" },
    { loc: "/studios", priority: "0.9" },
    { loc: "/register", priority: "0.7" },
    { loc: "/sign-in", priority: "0.5" },
    { loc: "/booking", priority: "0.8" },
    { loc: "/pricing", priority: "0.7" },
    { loc: "/about", priority: "0.6" },
    { loc: "/privacy", priority: "0.4" },
    { loc: "/terms", priority: "0.4" },
    { loc: "/mua", priority: "0.6" },
    { loc: "/quiz", priority: "0.5" },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url>
    <loc>${SITE_URL}${p.loc}</loc>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  })
}
