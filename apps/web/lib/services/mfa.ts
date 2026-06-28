const ATTEMPT_WINDOW_MS = 300_000
const MAX_ATTEMPTS = 5

type RateLimitEntry = { count: number; resetAt: number }
const attemptBuckets = new Map<string, RateLimitEntry>()

export async function verifyCode(secret: string, code: string): Promise<boolean> {
  const { verifySync } = await import("otplib")
  const result = verifySync({ token: code, secret })
  return result.valid
}

export function checkRateLimit(userId: string): void {
  const entry = attemptBuckets.get(userId)
  if (!entry) return
  if (Date.now() >= entry.resetAt) {
    attemptBuckets.delete(userId)
    return
  }
  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfterSec = Math.ceil((entry.resetAt - Date.now()) / 1000)
    throw new Error(`Too many MFA attempts. Please wait ${retryAfterSec} seconds.`)
  }
}

export function incrementAttempt(userId: string): void {
  const now = Date.now()
  const entry = attemptBuckets.get(userId)
  if (!entry || now >= entry.resetAt) {
    attemptBuckets.set(userId, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS })
    return
  }
  entry.count += 1
}
