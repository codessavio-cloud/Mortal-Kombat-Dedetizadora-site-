type LogLevel = "info" | "warn" | "error"

type LogContext = Record<string, unknown>

const SENSITIVE_KEY_PATTERN = /(password|token|secret|key|authorization|cookie)/i

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    }
  }

  if (typeof error === "object" && error !== null) {
    return { ...error }
  }

  return { message: String(error) }
}

function sanitizeContext(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeContext)
  }

  if (value && typeof value === "object") {
    const sanitized: Record<string, unknown> = {}

    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY_PATTERN.test(key)) {
        sanitized[key] = "[REDACTED]"
      } else {
        sanitized[key] = sanitizeContext(nestedValue)
      }
    }

    return sanitized
  }

  return value
}

function buildPayload(level: LogLevel, message: string, context?: LogContext) {
  const payload: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  }

  if (context) {
    for (const [key, value] of Object.entries(context)) {
      if (key === "error") {
        payload.error = sanitizeContext(normalizeError(value))
      } else {
        payload[key] = sanitizeContext(value)
      }
    }
  }

  return payload
}

function writeLog(level: LogLevel, message: string, context?: LogContext) {
  const payload = buildPayload(level, message, context)
  const line = JSON.stringify(payload)

  if (level === "error") {
    console.error(line)
    return
  }

  if (level === "warn") {
    console.warn(line)
    return
  }

  console.info(line)
}

export const appLogger = {
  info(message: string, context?: LogContext) {
    writeLog("info", message, context)
  },
  warn(message: string, context?: LogContext) {
    writeLog("warn", message, context)
  },
  error(message: string, context?: LogContext) {
    writeLog("error", message, context)
  },
}
