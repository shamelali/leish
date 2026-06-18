// Global error handling utilities

export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

export function safeExecute<T>(fn: () => T, fallback: T): T {
  try {
    return fn()
  } catch {
    return fallback
  }
}

export async function safeExecuteAsync<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn()
  } catch {
    return fallback
  }
}

// Suppress known browser extension errors
export function isKnownExtensionError(error: Error): boolean {
  const knownPatterns = [
    /core\.js/i,
    /Cannot read properties of undefined.*payload/i,
    /sentry/i,
    /apollo/i,
  ]
  return knownPatterns.some(pattern => pattern.test(error.message))
}

// Initialize global error handlers
export function initErrorHandlers(): void {
  if (typeof window === "undefined") return

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    // Suppress known extension errors
    if (event.reason instanceof Error && isKnownExtensionError(event.reason)) {
      event.preventDefault()
      console.debug("Suppressed extension error:", event.reason.message)
      return
    }
    
    // Log other errors
    console.error("Unhandled promise rejection:", event.reason)
  })

  // Handle global errors
  window.addEventListener("error", (event) => {
    // Suppress known extension errors
    if (event.error instanceof Error && isKnownExtensionError(event.error)) {
      event.preventDefault()
      console.debug("Suppressed extension error:", event.error.message)
      return
    }
    
    console.error("Global error:", event.error)
  })
}
