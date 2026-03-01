import { appLogger } from "@/lib/observability/logger"

type AuthMetricEvent =
  | "login_success"
  | "login_failed"
  | "login_rate_limited"
  | "logout"
  | "session_check_success"
  | "session_check_failed"

interface AuthMetricPayload {
  requestId?: string
  code?: string
  latencyMs?: number
  username?: string
  role?: string
  source?: string
}

const METRIC_WINDOW_SIZE = 200
const METRIC_EMIT_INTERVAL = 25

const latenciesByEvent = new Map<AuthMetricEvent, number[]>()
const countByEvent = new Map<AuthMetricEvent, number>()

function toP95(values: number[]) {
  if (values.length === 0) {
    return 0
  }

  const sorted = [...values].sort((left, right) => left - right)
  const index = Math.ceil(sorted.length * 0.95) - 1
  return sorted[Math.max(0, index)]
}

export function recordAuthMetric(event: AuthMetricEvent, payload: AuthMetricPayload = {}) {
  const currentCount = (countByEvent.get(event) || 0) + 1
  countByEvent.set(event, currentCount)

  if (typeof payload.latencyMs === "number" && Number.isFinite(payload.latencyMs)) {
    const previous = latenciesByEvent.get(event) || []
    previous.push(payload.latencyMs)

    if (previous.length > METRIC_WINDOW_SIZE) {
      previous.shift()
    }

    latenciesByEvent.set(event, previous)
  }

  const p95 = toP95(latenciesByEvent.get(event) || [])

  if (currentCount % METRIC_EMIT_INTERVAL === 0 || event === "login_rate_limited") {
    appLogger.info("Auth metric snapshot", {
      category: "auth-metric",
      event,
      count: currentCount,
      p95LatencyMs: p95,
      ...payload,
    })
  }
}
