import { describe, expect, it } from "vitest"
import { enforceRateLimit } from "./rate-limit"

function makeRequest(ip: string) {
  return new Request("https://example.com/api/bookings", {
    headers: {
      "x-forwarded-for": ip,
    },
  })
}

describe("enforceRateLimit", () => {
  it("allows requests until the limit is reached", () => {
    const req = makeRequest("203.0.113.10")

    const first = enforceRateLimit(req, "test:allow", 2, 60_000)
    const second = enforceRateLimit(req, "test:allow", 2, 60_000)

    expect(first.ok).toBe(true)
    expect(first.remaining).toBe(1)
    expect(second.ok).toBe(true)
    expect(second.remaining).toBe(0)
  })

  it("blocks requests after the limit is exceeded", () => {
    const req = makeRequest("203.0.113.11")

    enforceRateLimit(req, "test:block", 1, 60_000)
    const blocked = enforceRateLimit(req, "test:block", 1, 60_000)

    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterSec).toBeGreaterThan(0)
  })

  it("tracks limits separately per client ip", () => {
    const firstIp = makeRequest("203.0.113.12")
    const secondIp = makeRequest("203.0.113.13")

    const first = enforceRateLimit(firstIp, "test:ip-scope", 1, 60_000)
    const second = enforceRateLimit(secondIp, "test:ip-scope", 1, 60_000)

    expect(first.ok).toBe(true)
    expect(second.ok).toBe(true)
  })
})
