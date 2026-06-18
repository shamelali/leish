/**
 * Concierge v2 — backward-compatibility shim.
 *
 * The real implementation lives in lib/concierge/ (index, filters, memory, guardrails).
 * This file re-exports the old API surface used by existing tests and any legacy imports.
 */

export { generateResponse, processMessage, EMPTY_CONTEXT } from "./concierge/index"
export type { ConversationContext, ConciergeResponse } from "./concierge/index"

// matchArtists shim — wraps the new ranked engine with an empty context
import { rankArtists } from "./concierge/filters"
import { accumulateContext } from "./concierge/memory"
import { EMPTY_CONTEXT as _EMPTY } from "./concierge/types"
import type { Artist } from "./data"

interface LegacyMatchResult {
  artist: Artist
  score: number
  reason: string
}

export function matchArtists(userMessage: string): LegacyMatchResult[] {
  const ctx = accumulateContext(_EMPTY, userMessage)
  return rankArtists(ctx).map(({ artist, score, reason }) => ({ artist, score, reason }))
}
