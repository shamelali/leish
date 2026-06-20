import pino from "pino"
import pretty from "pino-pretty"

const isDevelopment = process.env.NODE_ENV !== "production"

const logger = pino(
  isDevelopment
    ? {
        level: "debug",
        transport: {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            ignore: "pid,hostname",
          },
        },
      }
    : {
        level: "info",
        formatters: {
          level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
      },
)

export function createRequestLogger(requestId: string, context?: Record<string, unknown>) {
  return logger.child({ requestId, ...context })
}

export default logger