"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MessageCircle, X, Send, Loader2, AlertCircle, Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

interface Message {
  id: string
  role: "customer" | "artist"
  text: string
  created_at: string
  sender_id: string
  receiver_id: string
  read_at?: string | null
}

interface ArtistChatProps {
  artistId: string
  artistName: string
}

const PHONE_PATTERNS = [
  /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g,
  /(\+60|\b60|\b0)[1-9]\d{8,9}/g,
  /\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/g,
  /\(\d{3}\)\s*\d{3}[-. ]?\d{4}/g,
]

const SOCIAL_MEDIA_PATTERNS = [
  /@\w{2,30}/g,
  /(instagram|facebook|twitter|tiktok|youtube|whatsapp)[\.]?com\/[\w.-]+/gi,
  /whatsapp:\s*\+?\d+/gi,
  /telegram:\s*\@?\w+/gi,
]

function filterSensitiveContent(text: string): { filtered: boolean; message: string } {
  let hasPhone = false
  let hasSocial = false

  for (const pattern of PHONE_PATTERNS) {
    if (pattern.test(text)) {
      hasPhone = true
      break
    }
  }

  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    if (pattern.test(text)) {
      hasSocial = true
      break
    }
  }

  if (hasPhone && hasSocial) {
    return {
      filtered: true,
      message: "Please avoid sharing phone numbers and social media handles in chat. Use the booking system to share contact details after confirming your booking."
    }
  }

  if (hasPhone) {
    return {
      filtered: true,
      message: "Please avoid sharing phone numbers in chat. You can share your phone after booking is confirmed through our secure system."
    }
  }

  if (hasSocial) {
    return {
      filtered: true,
      message: "Please avoid sharing social media handles in chat. You can connect with the artist through our platform after booking."
    }
  }

  return { filtered: false, message: text }
}

export function ArtistChat({ artistId, artistName }: ArtistChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [filterWarning, setFilterWarning] = useState<string | null>(null)
  const [showReportMenu, setShowReportMenu] = useState(false)
  const [reportSubmitted, setReportSubmitted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const reportViolation = useCallback(async (type: string) => {
    if (!userId) return
    try {
      await fetch("/api/providers/report-violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporterId: userId,
          reportedProviderId: artistId,
          violationType: type,
        }),
      })
      setReportSubmitted(true)
      setTimeout(() => {
        setShowReportMenu(false)
        setReportSubmitted(false)
      }, 3000)
    } catch (err) {
      console.error("Failed to report violation:", err)
    }
  }, [userId, artistId])

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    supabase.auth.getUser().then(({ data }) => {
      setIsAuthenticated(!!data.user)
      setUserId(data.user?.id ?? null)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user)
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!isOpen || !userId) return

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/messages?conversationWith=${artistId}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch (err) {
        console.error("Failed to fetch messages:", err)
      }
      setLoading(false)
    }

    fetchMessages()
  }, [isOpen, userId, artistId])

  useEffect(() => {
    if (!isOpen || !userId) return

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    const channel = supabase
      .channel(`chat:${userId}:${artistId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${userId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message
          if (newMessage.sender_id === artistId) {
            setMessages((prev) => [...prev, newMessage])
          }
        }
      )
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [isOpen, userId, artistId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || !userId || sending) return

    const filterResult = filterSensitiveContent(trimmed)
    if (filterResult.filtered) {
      setFilterWarning(filterResult.message)
      return
    }

    setSending(true)

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      role: "customer",
      text: trimmed,
      created_at: new Date().toISOString(),
      sender_id: userId!,
      receiver_id: artistId,
    }
    setMessages((prev) => [...prev, tempMessage])
    setInput("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setSending(false)
      return
    }

    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        receiverId: artistId,
        content: trimmed,
      }),
    })

    if (!res.ok) {
      console.error("Error sending message")
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
    }

    setSending(false)
  }, [input, userId, artistId, sending])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        aria-label={`Chat with ${artistName}`}
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[350px] flex-col rounded-2xl border border-border bg-background shadow-2xl sm:bottom-6 sm:right-6">
          <div className="flex items-center justify-between border-b border-border bg-secondary px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent">
                <MessageCircle className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-medium text-foreground">Chat with {artistName}</h3>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Direct Message</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowReportMenu(!showReportMenu)}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Report violation"
              >
                <Flag className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close chat"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {showReportMenu && (
            <div className="border-b border-border bg-amber-50 px-4 py-3 dark:bg-amber-950">
              {reportSubmitted ? (
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  Report submitted. We&#39;ll review this conversation.
                </p>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
                    Report a violation
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => reportViolation("external_contact_request")}
                      className="px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 rounded"
                    >
                      Asked to chat outside
                    </button>
                    <button
                      onClick={() => reportViolation("phone_shared")}
                      className="px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 rounded"
                    >
                      Shared phone
                    </button>
                    <button
                      onClick={() => reportViolation("social_shared")}
                      className="px-2 py-1 text-xs bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-900 dark:text-amber-100 rounded"
                    >
                      Shared social
                    </button>
                  </div>
                  <button
                    onClick={() => setShowReportMenu(false)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  Start a conversation with {artistName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Ask about availability, services, or custom requests
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.role === "customer" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] px-4 py-2 text-sm",
                        msg.role === "customer"
                          ? "bg-foreground text-primary-foreground"
                          : "border border-border bg-card text-foreground"
                      )}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-border p-3">
            {filterWarning && (
              <div className="mb-2 flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2 text-xs text-amber-600 dark:text-amber-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{filterWarning}</p>
              </div>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  setFilterWarning(null)
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || sending}
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-full transition-all",
                  input.trim() && !sending
                    ? "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Send message"
              >
                {sending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}