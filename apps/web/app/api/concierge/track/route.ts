import { NextRequest, NextResponse } from "next/server"
import { enforceRateLimit } from "@/lib/ops/rate-limit"

// ── In-memory metric store (resets on server restart) ────────────────────────
// For production, swap this out for a DB insert or an analytics service call.

interface MetricBucket {
  recommendation_shown: number
  recommendation_click: number
  fallback_triggered: number
  guardrail_triggered: number
  booking_started: number
  session_start: number
  session_end: number
}

const metrics: MetricBucket = {
  recommendation_shown: 0,
  recommendation_click: 0,
  fallback_triggered: 0,
  guardrail_triggered: 0,
  booking_started: 0,
  session_start: 0,
  session_end: 0,
}

// Individual events (capped to avoid unbounded memory)
const MAX_EVENTS = 10_000
const eventLog: unknown[] = []

// ── Route handlers ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rl = enforceRateLimit(req, "concierge:track", 120, 60_000)
  if (!rl.ok) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 })
  }

  const eventType = body.eventType as string | undefined
  if (!eventType || typeof eventType !== "string") {
    return NextResponse.json({ error: "missing_eventType" }, { status: 400 })
  }

  // Increment counter
  if (eventType in metrics) {
    metrics[eventType as keyof MetricBucket]++
  }

  // Append to event log
  if (eventLog.length < MAX_EVENTS) {
    eventLog.push({ ...body, receivedAt: new Date().toISOString() })
  }

  return NextResponse.json({ ok: true })
}

/**
 * GET /api/concierge/track
 * Returns aggregate metrics. In production, restrict to admin role.
 */
export async function GET(req: NextRequest) {
  // Basic auth guard: require internal token or admin session
  const authHeader = req.headers.get("authorization")
  const adminToken = process.env.ADMIN_API_TOKEN
  if (adminToken && authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const clickThrough =
    metrics.recommendation_shown > 0
      ? ((metrics.recommendation_click / metrics.recommendation_shown) * 100).toFixed(1) + "%"
      : "n/a"

  const fallbackRate =
    metrics.recommendation_shown + metrics.fallback_triggered > 0
      ? (
          (metrics.fallback_triggered /
            (metrics.recommendation_shown + metrics.fallback_triggered)) *
          100
        ).toFixed(1) + "%"
      : "n/a"

  const bookingConversion =
    metrics.session_start > 0
      ? ((metrics.booking_started / metrics.session_start) * 100).toFixed(1) + "%"
      : "n/a"

  return NextResponse.json({
    counters: metrics,
    derived: {
      clickThroughRate: clickThrough,
      fallbackRate: fallbackRate,
      bookingConversionRate: bookingConversion,
    },
    eventLogSize: eventLog.length,
  })
}
