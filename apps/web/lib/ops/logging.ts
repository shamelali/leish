type LogLevel = "debug" | "info" | "warn" | "error"

interface LogContext {
  [key: string]: string | number | boolean | null | undefined
}

interface StructuredLog extends LogContext {
  timestamp: string
  level: LogLevel
  message: string
  service: string
  environment: string
}

const SERVICE = "leish"
const ENVIRONMENT = process.env.NODE_ENV ?? "development"

function formatLog(level: LogLevel, message: string, context: LogContext = {}): StructuredLog {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: SERVICE,
    environment: ENVIRONMENT,
    ...context,
  }
}

function output(log: StructuredLog) {
  const formatted = JSON.stringify(log)
  switch (log.level) {
    case "debug":
      console.debug(formatted)
      break
    case "info":
      console.info(formatted)
      break
    case "warn":
      console.warn(formatted)
      break
    case "error":
      console.error(formatted)
      break
  }
}

export const logger = {
  debug(message: string, context?: LogContext) {
    output(formatLog("debug", message, context))
  },
  info(message: string, context?: LogContext) {
    output(formatLog("info", message, context))
  },
  warn(message: string, context?: LogContext) {
    output(formatLog("warn", message, context))
  },
  error(message: string, context?: LogContext) {
    output(formatLog("error", message, context))
  },
}

export function logBookingEvent(
  event: "created" | "updated" | "canceled" | "confirmed" | "paid",
  bookingId: string,
  providerId?: string,
  customerId?: string,
  amount?: number
) {
  logger.info(`booking.${event}`, {
    bookingId,
    providerId,
    customerId,
    amount,
    event,
  })
}

export function logPaymentEvent(
  event: "created" | "webhook_received" | "paid" | "failed" | "refunded",
  paymentId: string,
  gateway: string,
  bookingId?: string,
  amount?: number,
  metadata?: Record<string, unknown>
) {
  logger.info(`payment.${event}`, {
    paymentId,
    gateway,
    bookingId,
    amount,
    metadata: metadata ? JSON.stringify(metadata) : undefined,
    event,
  })
}

export function logApiRequest(
  endpoint: string,
  method: string,
  statusCode: number,
  durationMs: number,
  userId?: string
) {
  logger.info("api.request", {
    endpoint,
    method,
    statusCode,
    durationMs,
    userId,
  })
}
