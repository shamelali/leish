/**
 * Concierge v2 — main orchestrator
 *
 * Pipeline per turn:
 *   1. Apply guardrails (abuse, off-topic, too-short)
 *   2. Accumulate context from new message
 *   3. Check FAQ / hardcoded responses
 *   4. Run structured filter + ranking
 *   5. If no good match, ask targeted clarifying question
 *   6. Return typed ConciergeResponse
 */

import type { ConciergeResponse, ConversationContext } from "./types"
import { EMPTY_CONTEXT } from "./types"
import { rankArtists } from "./filters"
import { accumulateContext, contextRichness } from "./memory"
import {
  applyGuardrails,
  getClarifyingQuestion,
  getSuggestions,
  matchFaq,
} from "./guardrails"

export type { ConversationContext, ConciergeResponse } from "./types"
export { EMPTY_CONTEXT } from "./types"

// ── Public API ────────────────────────────────────────────────────────────────

export function processMessage(
  text: string,
  currentContext: ConversationContext,
  hasPhoto = false
): ConciergeResponse {
  // 1. Guardrails
  const guard = applyGuardrails(text)
  if (guard.type !== "pass") {
    const updatedContext = accumulateContext(currentContext, text, hasPhoto)
    return {
      text: guard.response,
      recommendations: [],
      responseType: guard.type === "off_topic" ? "guardrail_redirect" : "fallback",
      suggestions: getSuggestions(updatedContext, false),
      context: updatedContext,
    }
  }

  // 2. Accumulate context from this message
  const updatedContext = accumulateContext(currentContext, text, hasPhoto)

  // 3. FAQ / hardcoded responses (checked before ranking)
  const faq = matchFaq(text, updatedContext)
  if (faq.matched) {
    const isGreeting = updatedContext.turnCount <= 1
    return {
      text: faq.text,
      recommendations: [],
      responseType: isGreeting ? "greeting" : "availability_info",
      suggestions: getSuggestions(updatedContext, false),
      context: updatedContext,
    }
  }

  // 4. Rank artists against accumulated context
  const recommendations = rankArtists(updatedContext)

  if (recommendations.length > 0) {
    const label =
      recommendations.length === 1 ? "a perfect match" : `${recommendations.length} artists`
    return {
      text: `Based on everything you've shared, I found ${label} for you. Each has been personally vetted for artistry and professionalism.`,
      recommendations,
      responseType: "recommendations",
      suggestions: getSuggestions(updatedContext, true),
      context: updatedContext,
    }
  }

  // 5. Not enough context — ask the most useful follow-up
  const richness = contextRichness(updatedContext)

  if (richness < 1) {
    return {
      text: "I'd love to help! Could you tell me a bit about your event — the style, location, or budget?",
      recommendations: [],
      responseType: "fallback",
      suggestions: getSuggestions(updatedContext, false),
      context: updatedContext,
    }
  }

  return {
    text: getClarifyingQuestion(updatedContext),
    recommendations: [],
    responseType: "clarify_more",
    suggestions: getSuggestions(updatedContext, false),
    context: updatedContext,
  }
}

// ── Backward-compat shim for existing tests ───────────────────────────────────
// Keep the old `generateResponse` signature working so existing tests don't break.

export function generateResponse(userMessage: string): {
  text: string
  recommendations: { artist: import("@/lib/data").Artist; score: number; reason: string }[]
} {
  const result = processMessage(userMessage, EMPTY_CONTEXT)
  return {
    text: result.text,
    recommendations: result.recommendations,
  }
}
