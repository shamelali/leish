import { describe, expect, it, vi } from "vitest"

// validateBookingTransition is pure; stub the auth-bound Supabase client so
// importing ./db does not drag in next-auth.
vi.mock("@/lib/supabase/ssr", () => ({ getSupabaseSsrClient: vi.fn() }))
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
