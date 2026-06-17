import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"

export async function GET(req: Request) {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 })

  const url = new URL(req.url)
  const providerId = url.searchParams.get("provider_id")

  let query = supabase
    .from("reviews")
    .select("id, rating, body, status, created_at, author_id, provider_id")
    .order("created_at", { ascending: false })

  if (providerId) {
    query = query.eq("provider_id", providerId)
  } else {
    const { data: studio } = await supabase
      .from("providers")
      .select("id")
      .eq("owner_id", user.id)
      .eq("kind", "studio")
      .maybeSingle()
    if (studio) {
      query = query.eq("provider_id", studio.id)
    } else {
      return NextResponse.json([])
    }
  }

  const { data: reviews, error } = await query

  if (error) {
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
  return NextResponse.json(reviews)
}