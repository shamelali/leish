import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { studioRoomService } from "@/lib/services/studio-rooms"

export const dynamic = "force-dynamic"

async function getOwnedStudioId(userId: string): Promise<string | null> {
  const supabase = await getSupabaseSsrClient()
  const { data } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", userId)
    .eq("kind", "studio")
    .maybeSingle()
  return data?.id || null
}

export async function GET() {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = await getOwnedStudioId(user.id)
    if (!studioId) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const rooms = await studioRoomService.listByStudio(studioId)
    return NextResponse.json({ rooms })
  } catch (error) {
    console.error("[rooms] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const studioId = await getOwnedStudioId(user.id)
    if (!studioId) {
      return NextResponse.json({ error: "Studio not found" }, { status: 404 })
    }

    const body = await request.json()
    const room = await studioRoomService.create(studioId, body)
    return NextResponse.json({ room }, { status: 201 })
  } catch (error) {
    console.error("[rooms] POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
