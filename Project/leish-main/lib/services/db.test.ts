import { describe, expect, it } from "vitest"
import { validateBookingTransition } from "./db"

describe("validateBookingTransition", () => {
  it("allows valid moves", () => {
    expect(validateBookingTransition("pending", "payment_required")).toBe(true)
    expect(validateBookingTransition("payment_required", "canceled")).toBe(true)
    expect(validateBookingTransition("paid_full", "completed")).toBe(true)
  })

  it("rejects invalid moves", () => {
    expect(() => validateBookingTransition("pending", "completed")).toThrow()
    expect(() => validateBookingTransition("completed", "pending")).toThrow()
  })
})
