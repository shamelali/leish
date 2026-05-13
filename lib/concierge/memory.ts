import type { ConversationContext } from "./types"
import { parseEventTypes, parseBudget, parseLocation } from "./filters"

// ── Style / vibe keyword extraction ──────────────────────────────────────────

const STYLE_KEYWORDS = [
  "glam", "glamorous", "soft glam", "bold", "dramatic", "editorial",
  "avant-garde", "vintage", "retro", "classic", "modern", "trendy",
  "ethereal", "romantic", "dark", "gothic", "feminine", "minimal",
  "dewy", "matte", "glossy", "fresh", "natural", "sultry", "playful",
  "elegant", "sophisticated", "whimsical", "artistic",
]

function extractStyleNotes(text: string): string[] {
  const lower = text.toLowerCase()
  return STYLE_KEYWORDS.filter((kw) => lower.includes(kw))
}

// ── Context accumulation ──────────────────────────────────────────────────────

/**
 * Merge newly extracted entities from `text` into the existing `context`.
 * Always additive — never resets prior context.
 */
export function accumulateContext(
  current: ConversationContext,
  text: string,
  hasPhoto = false
): ConversationContext {
  const newEventTypes = parseEventTypes(text)
  const newLocation = parseLocation(text)
  const newBudget = parseBudget(text)
  const newStyleNotes = extractStyleNotes(text)

  // Merge event types (deduplicate)
  const mergedEventTypes = Array.from(new Set([...current.eventTypes, ...newEventTypes]))

  // Location: new explicit mention overrides
  const mergedLocation = newLocation ?? current.location

  // Budget: new explicit mention overrides (user may refine estimate)
  const mergedBudget = newBudget ?? current.budget

  // Style notes: append new ones, deduplicate
  const mergedStyleNotes = Array.from(new Set([...current.styleNotes, ...newStyleNotes]))

  return {
    eventTypes: mergedEventTypes,
    location: mergedLocation,
    budget: mergedBudget,
    styleNotes: mergedStyleNotes,
    hasInspirationPhoto: current.hasInspirationPhoto || hasPhoto,
    turnCount: current.turnCount + 1,
  }
}

/**
 * How well-populated is the context?
 * Returns a 0-3 score: 0 = empty, 3 = fully populated.
 */
export function contextRichness(ctx: ConversationContext): number {
  let score = 0
  if (ctx.eventTypes.length > 0) score++
  if (ctx.location) score++
  if (ctx.budget || ctx.styleNotes.length > 0) score++
  return score
}
