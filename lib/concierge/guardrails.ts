import type { ConversationContext } from "./types"
import { contextRichness } from "./memory"

// ── Off-topic detector ────────────────────────────────────────────────────────

const OFF_TOPIC_PATTERNS = [
  /\b(weather|temperature|rain|sunny|forecast)\b/i,
  /\b(politics|election|vote|government)\b/i,
  /\b(food|recipe|restaurant|menu|eat|cook|hungry)\b/i,
  /\b(sport|football|soccer|basketball|tennis)\b/i,
  /\b(movie|film|netflix|youtube|music|song)\b/i,
  /\b(stock|crypto|bitcoin|invest|trading|finance)\b/i,
  /\b(phone|laptop|computer|tech support|wifi|internet)\b/i,
  /\b(medication|doctor|hospital|diagnose|health condition)\b/i,
]

const ABUSE_PATTERNS = [
  /fuck|shit|bitch|asshole|cunt|dick|pussy|nigger/i,
]

// Phone and social media patterns reserved for future contact filtering features
// const PHONE_PATTERNS = [
//   /\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/,
//   /(\+60|\b60|\b0)[1-9]\d{8,9}/,
//   /\b\d{3}[-. ]?\d{3}[-. ]?\d{4}\b/,
//   /\(\d{3}\)\s*\d{3}[-. ]?\d{4}/,
// ]

// const SOCIAL_MEDIA_PATTERNS = [
//   /@\w{2,30}/,
//   /(instagram|facebook|twitter|tiktok|youtube|whatsapp)[\.]?com\/[\w.-]+/i,
//   /whatsapp:\s*\+?\d+/i,
//   /telegram:\s*\@?\w+/i,
// ]

const MAKEUP_TOPICS = [
  /\b(makeup|beauty|artist|bridal|wedding|event|photoshoot|natural|sfx|look|style|foundation|contour|lash|glam|hair)\b/i,
]

export type GuardrailResult =
  | { type: "pass" }
  | { type: "off_topic"; response: string }
  | { type: "abuse"; response: string }
  | { type: "too_short"; response: string }

export function applyGuardrails(text: string): GuardrailResult {
  const trimmed = text.trim()

  // Abuse
  if (ABUSE_PATTERNS.some((p) => p.test(trimmed))) {
    return {
      type: "abuse",
      response:
        "I'm here to help you find the perfect beauty artist. Let's keep the conversation focused on that — what kind of look are you going for?",
    }
  }

  // Too short / unintelligible
  if (trimmed.length < 3 || /^[^a-zA-Z0-9]+$/.test(trimmed)) {
    return {
      type: "too_short",
      response: "Could you share a bit more? Tell me about your event, the style you're looking for, or your location.",
    }
  }

  // Off-topic (only if it contains no makeup-related terms)
  if (
    OFF_TOPIC_PATTERNS.some((p) => p.test(trimmed)) &&
    !MAKEUP_TOPICS.some((p) => p.test(trimmed))
  ) {
    return {
      type: "off_topic",
      response:
        "I specialise exclusively in beauty and makeup artist recommendations. Is there a look, event, or artist type I can help you discover?",
    }
  }

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
