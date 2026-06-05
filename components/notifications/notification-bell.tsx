"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Bell, BellRing, X, CheckCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "@/lib/i18n/language-context"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface Notification {
  id: string
  user_id: string
  type: "booking" | "payment" | "review" | "message" | "system"
  title: string
  body: string
  data: Record<string, unknown> | null
  read_at: string | null
  created_at: string
}

const typeIcons: Record<string, string> = {
  booking: "📅",
  payment: "💰",
  review: "⭐",
  message: "💬",
  system: "🔔",
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const { lang } = useTranslation()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=10")
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false)
    }
  }, [])

  const handleRealtimeInsert = useCallback(
    (payload: { new: Record<string, unknown> }) => {
      const newNotification = payload.new as unknown as Notification
      setUnreadCount((prev) => prev + 1)
      setNotifications((prev) => {
        const exists = prev.some((n) => n.id === newNotification.id)
        if (exists) return prev
        return [newNotification, ...prev]
      })
    },
    [],
  )

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    let cancelled = false

    ;(async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id
      if (!userId || cancelled) return

      fetchNotifications()

      const channel = supabase
        .channel("notifications_realtime")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            handleRealtimeInsert(payload)
          },
        )
        .subscribe()

      channelRef.current = channel
    })()

    return () => {
      cancelled = true
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [fetchNotifications, handleRealtimeInsert])

  useEffect(() => {
    if (open) {
      fetchNotifications()
    }
  }, [open, fetchNotifications])

  const markAsRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })))
    setUnreadCount(0)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h3 className="font-medium text-sm">
            {lang === "ms" ? "Pemberitahuan" : "Notifications"}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <CheckCheck className="h-3 w-3" />
              {lang === "ms" ? "Baca semua" : "Mark all read"}
            </button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {lang === "ms"
                ? "Tiada pemberitahuan"
                : "No notifications"}
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`px-4 py-3 border-b last:border-b-0 transition-colors hover:bg-muted/50 ${
                  !notification.read_at ? "bg-muted/20" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg mt-0.5">
                    {typeIcons[notification.type] || "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notification.title}
                      </p>
                      {!notification.read_at && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(notification.created_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
