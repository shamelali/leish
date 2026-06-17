type AlertMeta = Record<string, string | number | boolean | null | undefined>

export async function reportApiError(context: string, error: unknown, meta: AlertMeta = {}) {
  const message = error instanceof Error ? error.message : String(error)
  const payload = {
    source: "api",
    context,
    message,
    meta,
    timestamp: new Date().toISOString(),
  }

  console.error("[api-error]", payload)

  const webhook = process.env.ALERT_WEBHOOK_URL
  if (!webhook) return

  try {
    await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch {
    // Intentionally swallow alert delivery failures to avoid breaking API paths.
  }
}

