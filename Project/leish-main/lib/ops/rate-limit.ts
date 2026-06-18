type Bucket = {
  count: number
  resetAt: number
}

type LimitResult = {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

type BlockResult = {
  blocked: boolean
  reason?: string
  delay?: number
}

const buckets = new Map<string, Bucket>()

const IP_WINDOW_MS = 3_600_000
const EMAIL_WINDOW_MS = 3_600_000
const GLOBAL_WINDOW_MS = 60_000
const IP_MAX_ATTEMPTS = 10
const EMAIL_MAX_ATTEMPTS = 5
const GLOBAL_MAX_ATTEMPTS = 100
const GLOBAL_DELAY_MS = 5_000

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
}

function getOrCreateBucket(key: string, windowMs: number): Bucket {
  const now = Date.now()
  const existing = buckets.get(key)
  if (!existing || existing.resetAt <= now) {
    const fresh = { count: 0, resetAt: now + windowMs }
    buckets.set(key, fresh)
    return fresh
  }
  return existing
}

export function enforceRateLimit(req: Request, key: string, max: number, windowMs: number): LimitResult {
  const ip = getClientIp(req)
  const bucketKey = `${key}:${ip}`
  const now = Date.now()
  const existing = buckets.get(bucketKey)

  if (!existing || existing.resetAt <= now) {
    buckets.set(bucketKey, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: max - 1, retryAfterSec: 0 }
  }

  if (existing.count >= max) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    }
  }

  existing.count += 1
  return { ok: true, remaining: max - existing.count, retryAfterSec: 0 }
}

export function recordFailedLoginAttempt(ip: string, email: string): void {
  getOrCreateBucket(`cs_ip:${ip}`, IP_WINDOW_MS).count += 1
  getOrCreateBucket(`cs_email:${email}`, EMAIL_WINDOW_MS).count += 1
  getOrCreateBucket("cs_global", GLOBAL_WINDOW_MS).count += 1
}

export function checkLoginBlocked(ip: string, email: string): BlockResult {
  const ipBucket = buckets.get(`cs_ip:${ip}`)
  if (ipBucket && Date.now() < ipBucket.resetAt && ipBucket.count > IP_MAX_ATTEMPTS) {
    return { blocked: true, reason: "Too many failed attempts from your IP" }
  }

  const emailBucket = buckets.get(`cs_email:${email}`)
  if (emailBucket && Date.now() < emailBucket.resetAt && emailBucket.count > EMAIL_MAX_ATTEMPTS) {
    return { blocked: true, reason: "Account temporarily locked" }
  }

  const globalBucket = buckets.get("cs_global")
  if (globalBucket && Date.now() < globalBucket.resetAt && globalBucket.count > GLOBAL_MAX_ATTEMPTS) {
    return { blocked: false, delay: GLOBAL_DELAY_MS }
  }

  return { blocked: false }
}

export function clearLoginAttempts(ip: string, email: string): void {
  buckets.delete(`cs_ip:${ip}`)
  buckets.delete(`cs_email:${email}`)
}
