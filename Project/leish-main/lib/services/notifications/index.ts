import { getSupabaseServerClient } from "@/lib/supabase/server"
import { sendEmail } from "@/lib/email/brevo"
import { notificationEmailTemplate } from "@/lib/email/templates"

export interface Notification {
  id: string
  user_id: string
  type: "booking" | "payment" | "review" | "message" | "system"
  title: string
  body: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

export interface NotificationCount {
  total: number
  unread: number
}

export const notificationService = {
  async list(userId: string, limit = 20, offset = 0): Promise<Notification[]> {
    const supabase = getSupabaseServerClient()
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    return (data as Notification[]) || []
  },

  async getUnreadCount(userId: string): Promise<number> {
    const supabase = getSupabaseServerClient()
    const { count } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .is("read_at", null)
    return count || 0
  },

  async markAsRead(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseServerClient()
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
  },

  async markAllAsRead(userId: string): Promise<void> {
    const supabase = getSupabaseServerClient()
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("read_at", null)
  },

  async create(input: Omit<Notification, "id" | "read_at" | "created_at">): Promise<Notification> {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from("notifications")
      .insert({
        user_id: input.user_id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: input.data,
      })
      .select()
      .maybeSingle()

    if (error) throw new Error(error.message)

    const notification = data as Notification

    // Fire-and-forget email notification via Brevo
    ;(async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", notification.user_id)
          .maybeSingle()

        if (profile?.email) {
          const template = notificationEmailTemplate({
            name: profile.full_name || "Valued Customer",
            title: notification.title,
            body: notification.body,
            type: notification.type,
          })
          await sendEmail({
            to: profile.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          })
        }
      } catch {
        // Silently ignore email failures — in-app notification was delivered
      }
    })()

    return notification
  },

  async delete(id: string, userId: string): Promise<void> {
    const supabase = getSupabaseServerClient()
    await supabase
      .from("notifications")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)
  },
}
