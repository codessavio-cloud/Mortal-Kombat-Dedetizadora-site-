import { AUTH_LOGIN_BLOCK_WINDOW_MS, AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS } from "@/lib/auth/constants"

export type RateLimitBucket = "auth" | "activity" | "users" | "db" | "default"

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
}

interface RateLimitRecord {
  count: number
  windowStart: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()
const MAX_RATE_LIMIT_KEYS = 20_000

const RATE_LIMIT_CONFIG: Record<RateLimitBucket, RateLimitConfig> = {
  auth: { windowMs: AUTH_LOGIN_BLOCK_WINDOW_MS, maxRequests: AUTH_LOGIN_RATE_LIMIT_MAX_REQUESTS },
  activity: { windowMs: 60_000, maxRequests: 80 },
  users: { windowMs: 60_000, maxRequests: 120 },
  db: { windowMs: 60_000, maxRequests: 40 },
  default: { windowMs: 60_000, maxRequests: 100 },
}

function resolveBucket(pathname: string): RateLimitBucket {
  if (pathname.includes("/api/auth/login")) return "auth"
  if (pathname.startsWith("/api/activity")) return "activity"
  if (pathname.startsWith("/api/users")) return "users"
  if (pathname.startsWith("/api/db/")) return "db"
  return "default"
}

function buildKey(ip: string, bucket: RateLimitBucket) {
  return `${ip}:${bucket}`
}

export function pruneRateLimitStore(now: number) {
  if (rateLimitStore.size > MAX_RATE_LIMIT_KEYS) {
    rateLimitStore.clear()
    return
  }

  for (const [key, value] of rateLimitStore.entries()) {
    if (now - value.windowStart > 5 * 60_000) {
      rateLimitStore.delete(key)
    }
  }
}

export function checkRateLimit(ip: string, pathname: string, now = Date.now()) {
  const bucket = resolveBucket(pathname)
  const config = RATE_LIMIT_CONFIG[bucket]
  const key = buildKey(ip, bucket)
  const record = rateLimitStore.get(key)

  if (!record || now - record.windowStart > config.windowMs) {
    rateLimitStore.set(key, { count: 1, windowStart: now })
    return {
      allowed: true,
      bucket,
      remaining: config.maxRequests - 1,
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    }
  }

  if (record.count >= config.maxRequests) {
    return {
      allowed: false,
      bucket,
      remaining: 0,
      retryAfterSeconds: Math.ceil((config.windowMs - (now - record.windowStart)) / 1000),
    }
  }

  record.count += 1
  return {
    allowed: true,
    bucket,
    remaining: config.maxRequests - record.count,
    retryAfterSeconds: Math.ceil(config.windowMs / 1000),
  }
}
