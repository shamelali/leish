import crypto from "crypto"
import { afterEach, describe, expect, it, vi } from "vitest"
import { verifyBillplzXSignature } from "./billplz"

describe("verifyBillplzXSignature", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("accepts a valid signature", () => {
    vi.stubEnv("BILLPLZ_X_SIGNATURE", "test-secret")

    const rawBody = "id=abc123&paid=true&reference_1=booking-1"
    const signature = crypto.createHmac("sha256", "test-secret").update(rawBody).digest("hex")

    expect(verifyBillplzXSignature(rawBody, signature)).toBe(true)
  })

  it("rejects an invalid signature", () => {
    vi.stubEnv("BILLPLZ_X_SIGNATURE", "test-secret")

    expect(verifyBillplzXSignature("id=abc123", "wrong-signature")).toBe(false)
  })
})
