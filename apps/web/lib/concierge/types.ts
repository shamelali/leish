import type { Artist, Category } from "@/lib/data"

// ── Extracted entities from conversation ─────────────────────────────────────

export interface ConversationContext {
  /** Detected makeup/event categories across all turns */
  eventTypes: Category[]
  /** Normalised location string matching Artist.location keys */
  location: string | null
  /** Budget band extracted from conversation */
  budget: { min: number; max: number } | null
  /** Free-text style notes collected across turns */
  styleNotes: string[]
  /** Whether a photo was uploaded in this session */
  hasInspirationPhoto: boolean
  /** Number of turns so far */
  turnCount: number
}

export const EMPTY_CONTEXT: ConversationContext = {
  eventTypes: [],
  location: null,
  budget: null,
  styleNotes: [],
  hasInspirationPhoto: false,
  turnCount: 0,
}

// ── Recommendation result ─────────────────────────────────────────────────────

export interface Recommendation {
  artist: Artist
  score: number
  /** Human-readable match rationale */
  reason: string
  /** Signals that contributed to this score */
  signals: MatchSignal[]
}

export interface MatchSignal {
  label: string
  points: number
}

// ── Concierge response ────────────────────────────────────────────────────────

export type ResponseType =
  | "greeting"
  | "recommendations"
  | "clarify_more"
  | "availability_info"
  | "pricing_info"
  | "guardrail_redirect"
  | "fallback"

export interface ConciergeResponse {
  text: string
  recommendations: Recommendation[]
  responseType: ResponseType
  /** Follow-up suggestion chips to show in UI */
  suggestions: string[]
  /** Updated context after this turn */
  context: ConversationContext
}
