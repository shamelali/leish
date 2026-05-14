type Bucket = {
  count: number
  resetAt: number
}

type LimitResult = {
  ok: boolean
  remaining: number
  retryAfterSec: number
}

const buckets = new Map<string, Bucket>()

function getClientIp(req: Request) {
  const forwardedFor = req.headers.get("x-forwarded-for")
  if (forwardedFor) {
    return forwardedFor.split(",")[0]?.trim() || "unknown"
  }
  return req.headers.get("x-real-ip") ?? "unknown"
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

