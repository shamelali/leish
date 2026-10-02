import { afterEach, describe, expect, it, vi } from "vitest"
import { authorizeCron } from "./cron-auth"

const req = (headers: Record<string, string> = {}) =>
  new Request("https://leish.my/api/cron/x", { headers })

afterEach(() => vi.unstubAllEnvs())

describe("authorizeCron", () => {
  it("accepts the correct bearer token", () => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    expect(authorizeCron(req({ authorization: "Bearer s3cret" }))).toBeNull()
  })

  it("accepts the x-cron-secret header", () => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    expect(authorizeCron(req({ "x-cron-secret": "s3cret" }))).toBeNull()
  })

  it("rejects a wrong or missing token", () => {
    vi.stubEnv("CRON_SECRET", "s3cret")
    expect(authorizeCron(req({ authorization: "Bearer nope" }))?.status).toBe(401)
    expect(authorizeCron(req({ authorization: "s3cret" }))?.status).toBe(401)
    expect(authorizeCron(req())?.status).toBe(401)
  })

  it("fails closed when CRON_SECRET is unset outside development", () => {
    vi.stubEnv("CRON_SECRET", "")
    vi.stubEnv("NODE_ENV", "production")
    expect(authorizeCron(req())?.status).toBe(500)
  })

  it("allows unauthenticated calls in local development", () => {
    vi.stubEnv("CRON_SECRET", "")
    vi.stubEnv("NODE_ENV", "development")
    expect(authorizeCron(req())).toBeNull()
  })
})
