import { NextResponse } from "next/server"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { reportApiError } from "@/lib/ops/alerts"
import { enforceRateLimit } from "@/lib/ops/rate-limit"

// GET /api/messages?conversationWith=xxx - Get conversation with a user
export async function GET(req: Request) {
  const limit = enforceRateLimit(req, "messages:get", 60, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    )
  }

  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url)
  const conversationWith = url.searchParams.get("conversationWith")
  const before = url.searchParams.get("before")
  const limit_messages = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100)

  try {
    let query = supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${conversationWith}),and(sender_id.eq.${conversationWith},receiver_id.eq.${user.id})`)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(limit_messages)

    if (before) {
      query = query.lt("created_at", before)
    }

    const { data: messages, error } = await query

    if (error) throw error

    // Mark messages as read
    if (conversationWith && messages && messages.length > 0) {
      await supabase.rpc("mark_messages_as_read", {
        p_sender_id: conversationWith,
        p_receiver_id: user.id,
      })
    }

    return NextResponse.json({
      ok: true,
      messages: messages?.reverse() || [],
      hasMore: messages?.length === limit_messages,
    })
  } catch (error) {
    await reportApiError("messages_get", error, { userId: user.id, conversationWith })
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(req: Request) {
  const limit = enforceRateLimit(req, "messages:send", 30, 60_000)
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Please slow down." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } }
    )
  }

  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: {
    receiverId: string
    content: string
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  // Validation
  if (!payload.receiverId || !payload.content?.trim()) {
    return NextResponse.json({ error: "Missing receiver or content" }, { status: 400 })
  }

  if (payload.content.length > 2000) {
    return NextResponse.json({ error: "Message too long (max 2000 characters)" }, { status: 400 })
  }

  if (payload.receiverId === user.id) {
    return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 })
  }

  // Check if receiver exists
  const { data: receiver } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", payload.receiverId)
    .maybeSingle()

  if (!receiver) {
    return NextResponse.json({ error: "Receiver not found" }, { status: 404 })
  }

  try {
    const { data: message, error } = await supabase
      .from("messages")
      .insert({
        sender_id: user.id,
        receiver_id: payload.receiverId,
        content: payload.content.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ ok: true, message })
  } catch (error) {
    await reportApiError("messages_post", error, { userId: user.id, receiverId: payload.receiverId })
    const message = error instanceof Error ? error.message : "Failed to send message"
    return NextResponse.json({ ok: false, error: message }, { status: 400 })
  }
}

// PATCH /api/messages - Mark messages as read
export async function PATCH(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  let payload: {
    senderId: string
  }

  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 })
  }

  try {
    await supabase.rpc("mark_messages_as_read", {
      p_sender_id: payload.senderId,
      p_receiver_id: user.id,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    await reportApiError("messages_patch", error, { userId: user.id, senderId: payload.senderId })
    return NextResponse.json({ error: "Failed to mark messages as read" }, { status: 500 })
  }
}

// DELETE /api/messages?id=xxx - Soft delete a message (sender only)
export async function DELETE(req: Request) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const url = new URL(req.url)
  const messageId = url.searchParams.get("id")

  if (!messageId) {
    return NextResponse.json({ error: "Missing message id" }, { status: 400 })
  }

  // Verify ownership
  const { data: message } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("id", messageId)
    .single()

  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 })
  }

  if (message.sender_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    await supabase
      .from("messages")
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq("id", messageId)

    return NextResponse.json({ ok: true })
  } catch (error) {
    await reportApiError("messages_delete", error, { userId: user.id, messageId })
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 })
  }
}
