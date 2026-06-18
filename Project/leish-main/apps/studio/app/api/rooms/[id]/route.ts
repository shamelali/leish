import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { studioRoomService } from "@/lib/services/studio-rooms"

export const dynamic = "force-dynamic"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    await studioRoomService.update(id, body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[rooms/[id]] PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    await studioRoomService.delete(id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[rooms/[id]] DELETE error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
