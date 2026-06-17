import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { notificationService } from "@/lib/services/notifications"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "20")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    const [notifications, unreadCount] = await Promise.all([
      notificationService.list(user.id, limit, offset),
      notificationService.getUnreadCount(user.id),
    ])

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    console.error("[notifications] GET error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (body.markAll) {
      await notificationService.markAllAsRead(user.id)
    } else if (body.id) {
      await notificationService.markAsRead(body.id, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[notifications] PATCH error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
