import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { reportApiError } from "@/lib/ops/alerts"

// GET /api/messages/conversations - Get list of conversations for current user
export async function GET() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  try {
    // Use the get_conversations function
    const { data: conversations, error } = await supabase.rpc("get_conversations", {
      p_user_id: user.id,
    })

    if (error) throw error

    // Get unread counts
    const { data: unreadCounts } = await supabase.rpc("get_unread_message_count", {
      p_user_id: user.id,
    })

    // Merge unread counts into conversations
    const enrichedConversations = (conversations || []).map((conv: Record<string, unknown>) => {
      const unread = (unreadCounts || []).find(
        (u: Record<string, unknown>) => u.sender_id === conv.conversation_partner_id
      )
      return {
        ...conv,
        unread_count: unread?.unread_count || 0,
      }
    })

    return NextResponse.json({
      ok: true,
      conversations: enrichedConversations,
    })
  } catch (error) {
    await reportApiError("conversations_get", error, { userId: user.id })
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 })
  }
}
