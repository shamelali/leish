import { describe, expect, it } from "vitest"
import { formatLoyaltyPoints, getTierProgress } from "./loyalty"

describe("formatLoyaltyPoints", () => {
  it("formats small numbers as-is", () => {
    expect(formatLoyaltyPoints(0)).toBe("0")
    expect(formatLoyaltyPoints(100)).toBe("100")
    expect(formatLoyaltyPoints(999)).toBe("999")
  })

  it("formats thousands with k suffix", () => {
    expect(formatLoyaltyPoints(1000)).toBe("1.0k")
    expect(formatLoyaltyPoints(1500)).toBe("1.5k")
    expect(formatLoyaltyPoints(10000)).toBe("10.0k")
  })
})

describe("getTierProgress", () => {
  const tierThresholds = { bronze: 0, silver: 500, gold: 1500, platinum: 3000 }

  it("returns bronze for low points", () => {
    const result = getTierProgress(100, tierThresholds)
    expect(result.currentTier).toBe("bronze")
    expect(result.nextTier).toBe("silver")
    expect(result.pointsToNextTier).toBe(400)
  })

  it("returns silver for mid points", () => {
    const result = getTierProgress(750, tierThresholds)
    expect(result.currentTier).toBe("silver")
    expect(result.nextTier).toBe("gold")
    expect(result.pointsToNextTier).toBe(750)
  })

  it("returns gold for high points", () => {
    const result = getTierProgress(2000, tierThresholds)
    expect(result.currentTier).toBe("gold")
    expect(result.nextTier).toBe("platinum")
    expect(result.pointsToNextTier).toBe(1000)
  })

  it("returns platinum with no next tier at max", () => {
    const result = getTierProgress(5000, tierThresholds)
    expect(result.currentTier).toBe("platinum")
    expect(result.nextTier).toBeNull()
    expect(result.progress).toBe(100)
  })

  it("calculates correct progress percentage", () => {
    const result = getTierProgress(500, tierThresholds)
    expect(result.progress).toBe(100)
  })

  it("handles exactly at threshold", () => {
    const result = getTierProgress(500, tierThresholds)
    expect(result.currentTier).toBe("silver")
    expect(result.nextTier).toBe("gold")
  })
})