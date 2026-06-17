import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getClient() {
  if (!supabaseUrl || !supabaseServiceKey) throw new Error("Missing Supabase env vars")
  return createClient(supabaseUrl, supabaseServiceKey, { auth: { autoRefreshToken: false, persistSession: false } })
}

export const notificationService = {
  async create(payload: { user_id: string; type: string; title: string; body: string; data?: Record<string, unknown> }) {
    const supabase = getClient()
    const { error } = await supabase.from("notifications").insert({
      user_id: payload.user_id, type: payload.type, title: payload.title,
      body: payload.body, data: payload.data ?? {},
    })
    if (error) console.error("Failed to create notification:", error)
  },
}
