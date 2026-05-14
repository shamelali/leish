import { describe, expect, it } from "vitest"

import { generateResponse, matchArtists } from "./concierge"

describe("matchArtists", () => {
  it("returns top matches for bridal request in KL", () => {
    const results = matchArtists("I need a bridal makeup artist in KL for my wedding")

    expect(results.length).toBeGreaterThan(0)
    expect(results.length).toBeLessThanOrEqual(3)
    expect(results.some((r) => r.artist.specialties.includes("Bridal"))).toBe(true)
  })

  it("uses affordable budget hint to bias lower-priced options", () => {
    const results = matchArtists("Need an affordable event makeup artist in Johor")

    expect(results.length).toBeGreaterThan(0)
    expect(results[0].artist.hourlyRate).toBeLessThanOrEqual(300)
  })
})

describe("generateResponse", () => {
  it("returns greeting response without recommendations", () => {
    const response = generateResponse("hello")

    expect(response.recommendations).toHaveLength(0)
    expect(response.text.toLowerCase()).toContain("beauty concierge")
  })

  it("returns availability guidance for availability questions", () => {
    const response = generateResponse("Are any artists available this weekend?")

    expect(response.recommendations).toHaveLength(0)
    expect(response.text.toLowerCase()).toContain("availability")
  })

  it("returns pricing guidance for generic price questions", () => {
    const response = generateResponse("How much does makeup cost?")

    expect(response.recommendations).toHaveLength(0)
    expect(response.text.toLowerCase()).toContain("myr")
  })

  it("returns recommendations for specific user needs", () => {
    const response = generateResponse("Need bridal makeup in Selangor with budget MYR 200 to MYR 500")

    expect(response.recommendations.length).toBeGreaterThan(0)
    expect(response.text.toLowerCase()).toContain("artist")
  })
})
