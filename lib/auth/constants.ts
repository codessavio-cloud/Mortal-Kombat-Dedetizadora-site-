export const AUTH_COOKIE_NAME = "auth-token"
export const AUTH_SESSION_TTL_SECONDS = 60 * 60 * 24
export const JWT_ALGORITHM = "HS256"

export const FALLBACK_ADMIN_DEFAULT_ID = "fallback-admin"

export const AUTH_LOGIN_MAX_ATTEMPTS = 5
export const AUTH_LOGIN_BLOCK_WINDOW_MS = 60_000
export const AUTH_LOGIN_BLOCK_WINDOW_SECONDS = AUTH_LOGIN_BLOCK_WINDOW_MS / 1000
export const AUTH_BLOCKED_IP_TTL_MS = 15 * 60_000

export const AUTH_ERROR_CODES = {
  jwtNotConfigured: "JWT_SECRET_NOT_CONFIGURED",
  notAuthenticated: "NOT_AUTHENTICATED",
  forbidden: "FORBIDDEN",
  invalidCredentials: "INVALID_CREDENTIALS",
} as const
