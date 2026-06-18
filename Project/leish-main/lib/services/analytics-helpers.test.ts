import { describe, expect, it } from "vitest"
import { formatCurrency, formatPercentage, formatNumber, getChangeIndicator, calculateGrowthRate } from "./analytics-helpers"

describe("formatCurrency", () => {
  it("formats MYR currency", () => {
    expect(formatCurrency(100)).toBe("MYR 100")
    expect(formatCurrency(1234.56)).toBe("MYR 1,234.56")
    expect(formatCurrency(0)).toBe("MYR 0")
  })
})

describe("formatPercentage", () => {
  it("formats percentages with sign", () => {
    expect(formatPercentage(10)).toBe("+10%")
    expect(formatPercentage(-5)).toBe("-5%")
    expect(formatPercentage(0)).toBe("0%")
  })

  it("rounds to one decimal place", () => {
    expect(formatPercentage(10.555)).toBe("+10.6%")
    expect(formatPercentage(-5.444)).toBe("-5.4%")
  })
})

describe("formatNumber", () => {
  it("formats large numbers with commas", () => {
    expect(formatNumber(1000)).toBe("1,000")
    expect(formatNumber(1000000)).toBe("1,000,000")
  })

  it("handles small numbers", () => {
    expect(formatNumber(0)).toBe("0")
    expect(formatNumber(99)).toBe("99")
  })
})

describe("getChangeIndicator", () => {
  it("returns up arrow for positive change", () => {
    expect(getChangeIndicator(5)).toBe("↑")
  })

  it("returns down arrow for negative change", () => {
    expect(getChangeIndicator(-3)).toBe("↓")
  })

  it("returns dash for zero", () => {
    expect(getChangeIndicator(0)).toBe("→")
  })
})

describe("calculateGrowthRate", () => {
  it("calculates positive growth", () => {
    expect(calculateGrowthRate(100, 150)).toBe(50)
  })

  it("calculates negative growth", () => {
    expect(calculateGrowthRate(100, 80)).toBe(-20)
  })

  it("returns 0 when previous is 0", () => {
    expect(calculateGrowthRate(0, 100)).toBe(0)
  })
})