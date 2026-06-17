import type { ConversationContext } from "./types"
import { contextRichness } from "./memory"

export type GuardrailResult =
  | { type: "pass" }
  | { type: "off_topic"; response: string }
  | { type: "abuse"; response: string }
  | { type: "too_short"; response: string }

export function applyGuardrails(): GuardrailResult {
  return { type: "pass" }
}

// ── Clarification follow-up generator ────────────────────────────────────────

/**
 * Given the current context richness, return the most useful clarifying question.
 */
export function getClarifyingQuestion(ctx: ConversationContext): string {
  // Priority order: event type → location → budget
  if (ctx.eventTypes.length === 0) {
    return "What's the occasion? For example: bridal, event, photoshoot, natural glam, or SFX."
  }
  if (!ctx.location) {
    return "Where are you based? I can find artists in Kuala Lumpur, Selangor, Penang, Johor, and more."
  }
  if (!ctx.budget) {
    return "What's your approximate budget? Our artists range from MYR 150 to MYR 900 per session."
  }
  return "Any specific style in mind — bold and dramatic, soft and natural, editorial, or something else?"
}

// ── Suggestion chips ──────────────────────────────────────────────────────────

const BASE_SUGGESTIONS = [
  "Bridal makeup in KL",
  "Natural look under MYR 300",
  "Photoshoot artist in Penang",
  "SFX makeup for Halloween",
  "Event glam in Selangor",
]

const POST_RECOMMENDATION_SUGGESTIONS = [
  "Show me more options",
  "What's the price range?",
  "Do they travel to me?",
  "How do I book?",
]

export function getSuggestions(ctx: ConversationContext, hasRecommendations: boolean): string[] {
  if (hasRecommendations) return POST_RECOMMENDATION_SUGGESTIONS
  const richness = contextRichness(ctx)
  if (richness >= 2) return POST_RECOMMENDATION_SUGGESTIONS
  return BASE_SUGGESTIONS
}

// ── Hardcoded FAQ responses ───────────────────────────────────────────────────

export type FaqMatch =
  | { matched: false }
  | { matched: true; text: string }

export function matchFaq(text: string, ctx: ConversationContext): FaqMatch {
  const lower = text.toLowerCase()

  // Greeting
  if (ctx.turnCount === 0 || /^(hi|hello|hey|good\s*(morning|afternoon|evening)|salam|assalamualaikum)/i.test(lower)) {
    return {
      matched: true,
      text: "Welcome to Leish! I'm your beauty concierge. Tell me about your event — the style, location, and budget — and I'll match you with the perfect artist.",
    }
  }

  // Availability — catch scheduling questions even if "artist/who" is present
  if (
    /\b(available|availability|free|open slot|schedule)\b/i.test(lower) &&
    !/\b(recommend|find|suggest|show me|looking for|need)\b/i.test(lower)
  ) {
    return {
      matched: true,
      text: "Each artist manages their own availability calendar. Once you find an artist you love, check their real-time availability on their profile page. Want me to recommend someone first?",
    }
  }

  // How to book
  if (/\b(how|steps?|process)\b.*\b(book|booking|reserve|get)\b/i.test(lower)) {
    return {
      matched: true,
      text: "Booking is simple: find an artist → pick an available slot → confirm and pay. Would you like me to suggest artists for your event?",
    }
  }

  // General pricing without specific context
  if (
    /\b(how much|price|pricing|cost|rates?|afford|charge)\b/i.test(lower) &&
    !/bridal|event|natural|photoshoot|sfx|wedding/i.test(lower)
  ) {
    return {
      matched: true,
      text: "Sessions range from MYR 150 to MYR 900 depending on the service. Bridal packages from MYR 400, photoshoots from MYR 500, and natural glam from MYR 150. What event are you planning?",
    }
  }

  // Travel
  if (/\b(travel|come to|reach me|outcall|onsite|location)\b/i.test(lower)) {
    return {
      matched: true,
      text: "Many of our artists offer outcall services and travel to venues. Check each artist's profile for their travel policy. Want me to find artists in your area?",
    }
  }

  return { matched: false }
}
