"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { X, Send, Sparkles, Upload, Star, MapPin, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { processMessage, EMPTY_CONTEXT } from "@/lib/concierge"
import type { ConversationContext } from "@/lib/concierge"
import type { Recommendation } from "@/lib/concierge/types"
import { trackConciergeEvent, resetSessionId } from "@/lib/concierge/metrics"
import type { Artist } from "@/lib/data"

// ── Message model ─────────────────────────────────────────────────────────────

interface Message {
  role: "assistant" | "user"
  text: string
  recommendations?: Recommendation[]
  suggestions?: string[]
}

// ── Drag types ────────────────────────────────────────────────────────────────

interface DragPosition {
  x: number
  y: number
}

type DragTarget = "fab" | "panel" | null

const FAB_SIZE = 56
const PANEL_WIDTH = 400
const PANEL_HEIGHT = 600
const FAB_STORAGE_KEY = "leish_concierge_fab_position"
const PANEL_STORAGE_KEY = "leish_concierge_panel_position"

// ── Artist card ───────────────────────────────────────────────────────────────

function ArtistCard({
  artist,
  reason,
  onClickTrack,
}: {
  artist: Artist
  reason: string
  onClickTrack: (artistId: string) => void
}) {
  return (
    <Link
      href={`/artists/${artist.slug}`}
      onClick={() => onClickTrack(artist.id)}
      className="flex gap-3 border border-border bg-card p-3 transition-all hover:border-accent"
    >
      <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden">
        <Image src={artist.image} alt={artist.name} fill className="object-cover" sizes="64px" />
      </div>
      <div className="flex flex-col justify-center">
        <p className="font-serif text-sm font-medium text-foreground">{artist.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs text-foreground">{artist.rating}</span>
          </div>
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span className="text-xs">{artist.location.split(",")[0]}</span>
          </div>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{reason}</p>
      </div>
    </Link>
  )
}

// ── Suggestion chips ──────────────────────────────────────────────────────────

function SuggestionChips({
  suggestions,
  onSelect,
}: {
  suggestions: string[]
  onSelect: (s: string) => void
}) {
  if (suggestions.length === 0) return null
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {suggestions.map((s) => (
        <button
          key={s}
          onClick={() => onSelect(s)}
          className="min-h-9 border border-border bg-secondary px-3 py-1.5 text-[10px] uppercase tracking-widest text-muted-foreground transition-all hover:border-accent hover:text-foreground"
        >
          {s}
        </button>
      ))}
    </div>
  )
}

// ── Drag helpers ──────────────────────────────────────────────────────────────

function clampPosition(position: DragPosition, width: number, height: number): DragPosition {
  if (typeof window === "undefined") return position
  return {
    x: Math.min(Math.max(0, position.x), Math.max(0, window.innerWidth - width)),
    y: Math.min(Math.max(0, position.y), Math.max(0, window.innerHeight - height)),
  }
}

function readStoredPosition(key: string, width: number, height: number): DragPosition | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<DragPosition>
    if (typeof parsed.x !== "number" || typeof parsed.y !== "number") return null
    return clampPosition({ x: parsed.x, y: parsed.y }, width, height)
  } catch {
    return null
  }
}

function writeStoredPosition(key: string, position: DragPosition | null) {
  if (typeof window === "undefined" || !position) return
  try {
    window.localStorage.setItem(key, JSON.stringify(position))
  } catch {
    // ignore
  }
}

// ── Initial welcome message ───────────────────────────────────────────────────

const WELCOME: Message = {
  role: "assistant",
  text: "Welcome to Leish! I'm your beauty concierge. Tell me about your event — the style, location, and budget — and I'll match you with the perfect artist.",
  suggestions: [
    "Bridal makeup in KL",
    "Natural look under MYR 300",
    "Photoshoot artist in Penang",
    "SFX makeup for Halloween",
  ],
}

// ── Main component ────────────────────────────────────────────────────────────

export function AiConcierge() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [context, setContext] = useState<ConversationContext>(EMPTY_CONTEXT)
  const [input, setInput] = useState("")
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [typing, setTyping] = useState(false)

  const [panelPosition, setPanelPosition] = useState<DragPosition | null>(() =>
    readStoredPosition(PANEL_STORAGE_KEY, PANEL_WIDTH, PANEL_HEIGHT)
  )
  const [fabPosition, setFabPosition] = useState<DragPosition | null>(() =>
    readStoredPosition(FAB_STORAGE_KEY, FAB_SIZE, FAB_SIZE)
  )

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const dragOffsetRef = useRef<DragPosition | null>(null)
  const draggingRef = useRef<DragTarget>(null)
  const movedDuringDragRef = useRef(false)

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, typing])

  // Persist positions
  useEffect(() => { writeStoredPosition(FAB_STORAGE_KEY, fabPosition) }, [fabPosition])
  useEffect(() => { writeStoredPosition(PANEL_STORAGE_KEY, panelPosition) }, [panelPosition])

  // Global pointer events for drag
  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const target = draggingRef.current
      const offset = dragOffsetRef.current
      if (!target || !offset) return
      if (window.innerWidth < 640) return

      movedDuringDragRef.current = true

      if (target === "panel") {
        setPanelPosition(
          clampPosition({ x: event.clientX - offset.x, y: event.clientY - offset.y }, PANEL_WIDTH, PANEL_HEIGHT)
        )
      }
      if (target === "fab") {
        setFabPosition(
          clampPosition({ x: event.clientX - offset.x, y: event.clientY - offset.y }, FAB_SIZE, FAB_SIZE)
        )
      }
    }

    const handlePointerUp = () => {
      draggingRef.current = null
      dragOffsetRef.current = null
      window.setTimeout(() => { movedDuringDragRef.current = false }, 0)
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [])

  const startDrag = (event: React.PointerEvent, target: Exclude<DragTarget, null>) => {
    if (window.innerWidth < 640) return
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    draggingRef.current = target
    movedDuringDragRef.current = false
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handlePanelDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current || window.innerWidth < 640) return
    const rect = panelRef.current.getBoundingClientRect()
    draggingRef.current = "panel"
    movedDuringDragRef.current = false
    dragOffsetRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handleOpenClick = () => {
    if (movedDuringDragRef.current) return
    setOpen(true)
    trackConciergeEvent({ eventType: "session_start" })
  }

  const handleClose = () => {
    setOpen(false)
    trackConciergeEvent({ eventType: "session_end" })
  }

  const handleReset = () => {
    setMessages([WELCOME])
    setContext(EMPTY_CONTEXT)
    setPhotoPreview(null)
    resetSessionId()
    trackConciergeEvent({ eventType: "session_start" })
  }

  const handleRecommendationClick = useCallback((artistId: string) => {
    trackConciergeEvent({
      eventType: "recommendation_click",
      artistId,
      turnCount: context.turnCount,
    })
    trackConciergeEvent({ eventType: "booking_started", artistId })
  }, [context.turnCount])

  const sendMessage = useCallback(
    async (text: string, hasPhoto = false) => {
      const trimmed = text.trim()
      if (!trimmed) return

      setMessages((prev) => [...prev, { role: "user", text: trimmed }])
      setInput("")
      setTyping(true)

      // Simulate natural thinking delay
      await new Promise((r) => setTimeout(r, 700 + Math.random() * 500))

      const response = processMessage(trimmed, context, hasPhoto)
      setContext(response.context)
      setTyping(false)

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: response.text,
          recommendations: response.recommendations.length > 0 ? response.recommendations : undefined,
          suggestions: response.suggestions.length > 0 ? response.suggestions : undefined,
        },
      ])

      // Track metrics
      if (response.recommendations.length > 0) {
        trackConciergeEvent({
          eventType: "recommendation_shown",
          responseType: response.responseType,
          turnCount: response.context.turnCount,
        })
      } else if (response.responseType === "fallback" || response.responseType === "clarify_more") {
        trackConciergeEvent({
          eventType: "fallback_triggered",
          responseType: response.responseType,
          turnCount: response.context.turnCount,
        })
      } else if (response.responseType === "guardrail_redirect") {
        trackConciergeEvent({
          eventType: "guardrail_triggered",
          responseType: response.responseType,
          turnCount: response.context.turnCount,
        })
      }
    },
    [context]
  )

  const handleSend = () => sendMessage(input)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setPhotoPreview(url)

    sendMessage("I uploaded an inspiration photo.", true)
  }

  return (
    <>
       {/* FAB */}
       {!open && (
         <button
           onPointerDown={(event) => startDrag(event, "fab")}
           onClick={handleOpenClick}
           className={cn(
             "fixed z-40 flex items-center justify-center bg-accent text-accent-foreground shadow-lg transition-transform hover:scale-105 active:scale-95",
             fabPosition ? "" : "bottom-6 right-6",
             !fabPosition && "w-full lg:w-14 lg:h-14"
           )}
           style={fabPosition ? { left: fabPosition.x, top: fabPosition.y } : undefined}
           aria-label="Open beauty concierge"
         >
           <Sparkles className="h-6 w-6 lg:h-8 lg:w-8" />
         </button>
       )}

      {/* Panel */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-50 flex flex-col border-l border-border bg-background shadow-2xl",
            panelPosition
              ? "sm:h-[600px] sm:w-[400px] sm:border"
              : "bottom-0 right-0 h-full w-full sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:border"
          )}
          style={
            panelPosition
              ? { left: panelPosition.x, top: panelPosition.y, width: PANEL_WIDTH, height: PANEL_HEIGHT }
              : undefined
          }
        >
          {/* Header */}
          <div
            onPointerDown={handlePanelDragStart}
            className="flex cursor-grab items-center justify-between border-b border-border bg-secondary px-5 py-4 active:cursor-grabbing sm:touch-none"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center bg-accent">
                <Sparkles className="h-4 w-4 text-accent-foreground" />
              </div>
              <div>
                <h3 className="font-serif text-sm font-medium text-foreground">Beauty Concierge</h3>
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

                  {/* Artist recommendation cards */}
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

                  {/* Suggestion chips (only on last assistant message) */}
                  {msg.role === "assistant" && msg.suggestions && i === messages.length - 1 && (
                    <SuggestionChips
                      suggestions={msg.suggestions}
                      onSelect={(s) => sendMessage(s)}
                    />
                  )}
                </div>
              ))}

              {/* Typing indicator */}
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

              {/* Inspiration photo preview */}
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
          <div className="border-t border-border bg-card p-4">
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
