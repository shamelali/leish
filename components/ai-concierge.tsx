"use client"

import { useEffect, useState, useRef } from "react"
import { Sparkles, X, RotateCcw, Upload, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { ArtistCard } from "@/components/artist-card"
import { SuggestionChips } from "@/components/suggestion-chips"
import Image from "next/image"

const WELCOME: Message = {
  role: "assistant",
  text: "Welcome to Leish! Tell me about your event — the style, location, and budget — and I'll match you with the perfect artist.",
  suggestions: [
    "Bridal makeup in KL",
    "Natural look under MYR 300",
    "Photoshoot artist in Penang",
    "SFX makeup for Halloween",
  ],
}

export function AiConcierge() {
  const [open, setOpen] = useState(false)
  const [panelPosition, setPanelPosition] = useState<{ x: number; y: number } | null>(null)
  const [fabPosition, setFabPosition] = useState<{ x: number; y: number } | null>(null)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState("")
  const [typing, setTyping] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const PANEL_WIDTH = 400
  const PANEL_HEIGHT = 600

  const handleOpenClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setPanelPosition(null)
  }

  const handleReset = () => {
    setMessages([WELCOME])
    setInput("")
  }

  const startDrag = (event: React.PointerEvent, type: "fab" | "panel") => {
    const startX = event.clientX
    const startY = event.clientY

    const handleMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startX
      const dy = moveEvent.clientY - startY
      if (type === "fab") {
        setFabPosition((prev) => {
          if (!prev) return { x: dx, y: dy }
          return { x: prev.x + dx, y: prev.y + dy }
        })
      } else {
        setPanelPosition((prev) => {
          if (!prev) return { x: dx, y: dy }
          return { x: prev.x + dx, y: prev.y + dy }
        })
      }
    }

    const handleUp = () => {
      window.removeEventListener("pointermove", handleMove)
      window.removeEventListener("pointerup", handleUp)
    }

    window.addEventListener("pointermove", handleMove)
    window.addEventListener("pointerup", handleUp)
  }

    const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const url = URL.createObjectURL(file)
      setPhotoPreview(url)
      setMessages(prev => [...prev, { role: "user", text: "I uploaded an inspiration photo." }])
      setInput("")
    }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = async () => {
    if (!input.trim() || typing) return

    const userMessage: Message = {
      role: "user",
      text: input,
    }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setTyping(true)

    // Simulate API delay
    try {
      const botMessage = await generateResponse(input, messages)
      setMessages((prev) => [...prev, botMessage])
    } catch (error) {
      console.error(error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setTyping(false)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleStorage = () => {
      const stored = sessionStorage.getItem("leish_concierge_fab_position")
      if (stored) {
        try {
          const pos = JSON.parse(stored)
          setFabPosition(pos)
        } catch (e) {
          console.error("Failed to parse FAB position from sessionStorage", e)
        }
      }

      const storedPanel = sessionStorage.getItem("leish_concierge_panel_position")
      if (storedPanel) {
        try {
          const pos = JSON.parse(storedPanel)
          setPanelPosition(pos)
        } catch (e) {
          console.error("Failed to parse panel position from sessionStorage", e)
        }
      }
    }

    handleStorage()
    window.addEventListener("storage", handleStorage)
    return () => window.removeEventListener("storage", handleStorage)
  }, [])

  useEffect(() => {
    if (fabPosition) {
      sessionStorage.setItem("leish_concierge_fab_position", JSON.stringify(fabPosition))
    }
  }, [fabPosition])

  useEffect(() => {
    if (panelPosition) {
      sessionStorage.setItem("leish_concierge_panel_position", JSON.stringify(panelPosition))
    }
  }, [panelPosition])

  return (
    <>
      {/* FAB */}
      {!open && (
        <button
          onPointerDown={(event) => startDrag(event, "fab")}
          onClick={handleOpenClick}
          className={cn(
            "fixed z-40 flex items-center justify-center bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
            fabPosition ? "" : "bottom-4 right-4 sm:bottom-6 sm:right-6",
            !fabPosition && "h-12 w-12 sm:h-14 sm:w-14"
          )}
          style={fabPosition ? { left: fabPosition.x, top: fabPosition.y } : undefined}
          aria-label="Open beauty concierge"
        >
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>
      )}

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-50 flex flex-col bg-background shadow-2xl",
            panelPosition
              ? "border-l border-border md:h-[600px] md:w-[400px] md:border"
              : "bottom-0 right-0 h-full w-full border-0 md:bottom-6 md:right-6 md:h-[600px] md:w-[400px] md:border md:border-border"
          )}
          style={
            panelPosition
              ? { left: panelPosition.x, top: panelPosition.y, width: PANEL_WIDTH, height: PANEL_HEIGHT }
              : undefined
          }
        >
          {/* Header */}
          <div
            onPointerDown={(e) => startDrag(e, "panel")}
            className="flex cursor-grab items-center justify-between border-b border-border bg-secondary px-5 py-4 active:cursor-grabbing sm:touch-none"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6" />
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">AI-Powered · Drag me</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleReset}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Start new conversation"
                title="Start new conversation"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
              <button
                onClick={handleClose}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close concierge"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-4">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col", msg.role === "user" ? "items-end" : "items-start")}>
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 text-sm leading-relaxed",
                      msg.role === "user"
                        ? "bg-foreground text-primary-foreground"
                        : "border border-border bg-card text-foreground"
                    )}
                  >
                    {msg.text}
                  </div>

                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-2 flex w-full max-w-[85%] flex-col gap-2">
                      {msg.recommendations.map((rec) => (
                        <ArtistCard
                          key={rec.artist.id}
                          artist={rec.artist}
                          reason={rec.reason}
                          onClickTrack={handleRecommendationClick}
                        />
                      ))}
                    </div>
                  )}

                  {msg.role === "assistant" && msg.suggestions && i === messages.length - 1 && (
                    <SuggestionChips
                      suggestions={msg.suggestions}
                      onSelect={(s) => {
                        setMessages(prev => [...prev, { role: "user", text: s }]);
                        setInput("");
                      }}
                    />
                  )}
                </div>
              ))}

              {typing && (
                <div className="flex items-start">
                  <div className="border border-border bg-card px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:150ms]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}

              {photoPreview && (
                <div className="flex justify-end">
                  <div className="relative h-24 w-24 overflow-hidden border border-border">
                    <Image src={photoPreview} alt="Inspiration upload" fill className="object-cover" sizes="96px" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-border bg-card p-4">
            <div className="mb-3 flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                aria-label="Upload inspiration photo"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 border border-border px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:border-accent hover:text-foreground"
              >
                <Upload className="h-3 w-3" />
                Upload Photo
              </button>
              <span className="text-[10px] text-muted-foreground">for personalised suggestions</span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your event..."
                className="flex-1 border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-accent focus:outline-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || typing}
                className={cn(
                  "flex h-[46px] w-[46px] items-center justify-center transition-all",
                  input.trim() && !typing
                    ? "bg-foreground text-primary-foreground hover:bg-accent hover:text-accent-foreground"
                    : "bg-muted text-muted-foreground"
                )}
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// Types
type Message = {
  role: "user" | "assistant"
  text: string
  suggestions?: string[]
  recommendations?: Recommendation[]
}

type Recommendation = {
  artist: {
    id: string
    name: string
    username: string
    avatar_url: string | null
    subscription_tier: string
    is_available: boolean
    rating: number | null
    review_count: number
  }
  reason: string
}

// Mock function - replace with actual API call
async function generateResponse(
  input: string,
  // todo: _messages: Message[]
): Promise<Message> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  // Simple echo bot for demonstration
  return {
    role: "assistant",
    text: `You said: "${input}". This is a mock response. In a real app, this would call your backend.`,
    suggestions: [
      "Tell me more",
      "Try another topic",
      "See featured artists",
    ],
  }
}

const handleRecommendationClick = (artistId: string) => {
  // In a real app, this would track the recommendation and navigate to the artist profile
  console.log(`Recommendation clicked for artist: ${artistId}`)
}