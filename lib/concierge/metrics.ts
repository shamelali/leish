/**
 * Client-side metric event tracker for the AI concierge.
 *
 * Events are fire-and-forget POSTs to /api/concierge/track.
 * Failures are silently swallowed so they never affect UX.
 */

export type ConciergeEventType =
  | "recommendation_shown"    // concierge returned ≥1 artist cards
  | "recommendation_click"    // user clicked an artist card from concierge
  | "fallback_triggered"      // no match found after user message
  | "guardrail_triggered"     // off-topic / abuse intercepted
  | "booking_started"         // user navigated to artist profile from concierge
  | "session_start"           // panel opened
  | "session_end"             // panel closed

export interface ConciergeEvent {
  eventType: ConciergeEventType
  sessionId: string
  /** Artist ID if event is artist-specific */
  artistId?: string
  /** Response type from concierge */
  responseType?: string
  /** Turn number within session */
  turnCount?: number
  timestamp?: string
}

// ── Session ID ────────────────────────────────────────────────────────────────

let _sessionId: string | null = null

export function getSessionId(): string {
  if (_sessionId) return _sessionId
  if (typeof window !== "undefined") {
    const stored = sessionStorage.getItem("leish_concierge_session")
    if (stored) {
      _sessionId = stored
      return _sessionId
    }
    _sessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
    try {
      sessionStorage.setItem("leish_concierge_session", _sessionId)
    } catch {
      // ignore
    }
  } else {
    _sessionId = `cs_ssr_${Date.now()}`
  }
  return _sessionId
}

export function resetSessionId(): void {
  _sessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("leish_concierge_session", _sessionId)
    } catch {
      // ignore
    }
  }
}

// ── Track ─────────────────────────────────────────────────────────────────────

export function trackConciergeEvent(event: Omit<ConciergeEvent, "sessionId" | "timestamp">): void {
  if (typeof window === "undefined") return

  const payload: ConciergeEvent = {
    ...event,
    sessionId: getSessionId(),
    timestamp: new Date().toISOString(),
  }

  // Fire-and-forget
  fetch("/api/concierge/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    // Silently swallow
  })
}
