import { describe, expect, it } from "vitest"
import {
  applyGuardrails,
  getClarifyingQuestion,
  getSuggestions,
  matchFaq,
} from "./guardrails"
import type { Category } from "@/lib/data"
import type { ConversationContext } from "./types"

const baseCtx: ConversationContext = {
  turnCount: 1,
  eventTypes: ["Bridal"] as Category[],
  location: "KL",
  budget: null,
  styleNotes: [],
  hasInspirationPhoto: false,
}

describe("applyGuardrails", () => {
  it("passes normal makeup queries", () => {
    expect(applyGuardrails("I need bridal makeup")).toEqual({ type: "pass" })
    expect(applyGuardrails("find me an artist for photoshoot")).toEqual({ type: "pass" })
  })

  it("blocks abuse", () => {
    const result = applyGuardrails("fuck this")
    expect(result.type).toBe("abuse")
  })

  it("rejects too-short input", () => {
    expect(applyGuardrails("a")).toEqual({ type: "too_short", response: expect.any(String) })
    expect(applyGuardrails("!!")).toEqual({ type: "too_short", response: expect.any(String) })
  })

  it("flags off-topic when no makeup terms present", () => {
    const result = applyGuardrails("what is the weather today")
    expect(result.type).toBe("off_topic")
  })

  it("allows off-topic terms when makeup terms are present", () => {
    expect(applyGuardrails("weather for bridal makeup outdoor")).toEqual({ type: "pass" })
  })

  it("passes empty-adjacent non-abuse text under 3 chars", () => {
    expect(applyGuardrails("x")).toEqual({ type: "too_short", response: expect.any(String) })
  })
})

describe("getClarifyingQuestion", () => {
  it("asks for event type when missing", () => {
    const ctx = { ...baseCtx, eventTypes: [] }
    expect(getClarifyingQuestion(ctx)).toContain("occasion")
  })

  it("asks for location when missing", () => {
    const ctx = { ...baseCtx, location: null }
    expect(getClarifyingQuestion(ctx)).toContain("Where are you")
  })

  it("asks for budget when missing", () => {
    const ctx = { ...baseCtx, budget: null }
    expect(getClarifyingQuestion(ctx)).toContain("budget")
  })

  it("asks about style when all core info is present", () => {
    const ctx = { ...baseCtx, budget: { min: 200, max: 500 } }
    expect(getClarifyingQuestion(ctx)).toContain("style")
  })
})

describe("getSuggestions", () => {
  it("returns base suggestions when context is sparse and no recommendations", () => {
    const sparseCtx = { ...baseCtx, eventTypes: [], location: null, budget: null }
    const suggestions = getSuggestions(sparseCtx, false)
    expect(suggestions).toContain("Bridal makeup in KL")
  })

  it("returns post-recommendation suggestions when hasRecommendations", () => {
    const suggestions = getSuggestions(baseCtx, true)
    expect(suggestions).toContain("Show me more options")
  })
})

describe("matchFaq", () => {
  it("matches greeting on first turn", () => {
    const ctx = { ...baseCtx, turnCount: 0 }
    const result = matchFaq("hi", ctx)
    expect(result.matched).toBe(true)
  })

  it("matches hello variants", () => {
    const result = matchFaq("hello", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("matches salam greeting", () => {
    const result = matchFaq("assalamualaikum", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("matches availability question", () => {
    const result = matchFaq("when is she available?", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("does not match availability when looking for recommendation", () => {
    const result = matchFaq("find me an available artist", baseCtx)
    expect(result.matched).toBe(false)
  })

  it("matches how to book", () => {
    const result = matchFaq("how do I book?", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("matches pricing question", () => {
    const result = matchFaq("how much does it cost?", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("does not match pricing when specific event is mentioned", () => {
    const result = matchFaq("how much for bridal makeup?", baseCtx)
    expect(result.matched).toBe(false)
  })

  it("matches travel question", () => {
    const result = matchFaq("do you travel to my location?", baseCtx)
    expect(result.matched).toBe(true)
  })

  it("returns unmatched for unknown queries", () => {
    const result = matchFaq("what is contouring", baseCtx)
    expect(result.matched).toBe(false)
  })
})
