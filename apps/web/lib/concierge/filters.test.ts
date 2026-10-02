import { describe, expect, it } from "vitest"
import { parseBudget, parseExperienceYears } from "./filters"

describe("parseBudget", () => {
  it.each([
    ["RM300 - RM600", { min: 300, max: 600 }],
    ["300-600", { min: 300, max: 600 }],
    ["300 – 600", { min: 300, max: 600 }],
    ["myr 300 to myr 600", { min: 300, max: 600 }],
    ["600 to 300", { min: 300, max: 600 }],
    ["under RM 400", { min: 0, max: 400 }],
    ["starting from 250", { min: 250, max: 99999 }],
    ["around RM 350", { min: 0, max: 350 }],
    ["something affordable", { min: 0, max: 300 }],
    ["premium bridal", { min: 400, max: 99999 }],
  ])("parses %j", (text, expected) => {
    expect(parseBudget(text)).toEqual(expected)
  })

  it("does not treat 'too'/'oo' as a range separator", () => {
    expect(parseBudget("300 too 600")).toBeNull()
    expect(parseBudget("300 oo 600")).toBeNull()
  })

  it("returns null when there is no budget", () => {
    expect(parseBudget("bridal makeup in KL")).toBeNull()
  })

  it("stays fast on long adversarial input", () => {
    const evil = `rm${" ".repeat(50_000)}x`
    const start = performance.now()
    parseBudget(evil)
    expect(performance.now() - start).toBeLessThan(200)
  })
})

describe("parseExperienceYears", () => {
  it.each([
    ["5 years experience", 5],
    ["10+ years", 10],
    ["1 year", 1],
    ["a beginner", 0],
    ["veteran artist", 10],
    ["no info", 0],
  ])("parses %j", (text, expected) => {
    expect(parseExperienceYears(text)).toBe(expected)
  })
})
