const store = new Map<string, { count: number; resetAt: number }>()

export function enforceRateLimit(req: Request, key: string, maxAttempts: number, windowMs: number) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
  const storeKey = `${key}:${ip}`
  const now = Date.now()
  const entry = store.get(storeKey)

  if (!entry || now > entry.resetAt) {
    store.set(storeKey, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    const retryAfterSec = Math.ceil((entry.resetAt - now) / 1000)
    return { ok: false, retryAfterSec }
  }

  return { ok: true, retryAfterSec: 0 }
}
