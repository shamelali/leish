import { createClient } from "@supabase/supabase-js"

interface RateLimitResult {
  ok: boolean
  retryAfterSec: number
}

export async function enforceRateLimit(
  req: Request,
  key: string,
  maxAttempts: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  const bucketKey = `${key}:${ip}`

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return { ok: true, retryAfterSec: 0 }
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  const { data, error } = await supabase.rpc("rate_limit_check", {
    p_bucket: bucketKey,
    p_max: maxAttempts,
    p_window_ms: windowMs,
  })

  if (error) {
    return { ok: true, retryAfterSec: 0 }
  }

  return data as unknown as RateLimitResult
}
