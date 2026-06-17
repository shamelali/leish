import { NextResponse } from "next/server"
import { notificationService } from "@/lib/services/notifications"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export const dynamic = "force-dynamic"

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseSsrClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()

    if (!body.user_id || !body.type || !body.title || !body.body) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (!["booking", "payment", "review", "message", "system"].includes(body.type)) {
      return NextResponse.json({ error: "Invalid notification type" }, { status: 400 })
    }

    const notification = await notificationService.create({
      user_id: body.user_id,
      type: body.type,
      title: body.title,
      body: body.body,
      data: body.data || null,
    })

    return NextResponse.json({ notification }, { status: 201 })
  } catch (error) {
    console.error("[notifications/send] error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
