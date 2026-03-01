import { NextResponse } from "next/server"
import { createHash, timingSafeEqual } from "node:crypto"

import {
  AUTH_COOKIE_NAME,
  AUTH_ERROR_CODES,
  AUTH_LOGIN_BLOCK_WINDOW_MS,
  AUTH_LOGIN_BLOCK_WINDOW_SECONDS,
  AUTH_LOGIN_MAX_ATTEMPTS,
  AUTH_SESSION_TTL_SECONDS,
  FALLBACK_ADMIN_DEFAULT_ID,
} from "@/lib/auth/constants"
import { isJwtSecretConfigured, signAuthToken, type UserRole } from "@/lib/auth/jwt"
import { hashPassword, verifyPassword } from "@/lib/auth/password"
import { appLogger } from "@/lib/observability/logger"
import { recordAuthMetric } from "@/lib/observability/auth-metrics"
import { parseJsonBodyWithLimit } from "@/lib/security/body"
import { enforceSameOrigin } from "@/lib/security/request"
import {
  isValidUsername,
  normalizeCoordinate,
  sanitizePlainText,
  validatePasswordLength,
} from "@/lib/security/validation"
import { createClient } from "@/lib/supabase/server"
import { isSupabasePublicConfigured } from "@/lib/supabase/config"
import { resolvePostLoginRedirect } from "@/lib/auth/session-utils"

const MAX_LOGIN_PAYLOAD_BYTES = 8 * 1024
const loginAttemptsByIp = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>()
const loginAttemptsByUsername = new Map<string, { count: number; lastAttempt: number; blocked: boolean }>()

interface AuthenticatedUser {
  id: string
  username: string
  role: UserRole
}

interface SupabaseUserRow {
  id: string
  username: string
  role: UserRole
  password_hash: string
}

interface LoginLocation {
  latitude: number
  longitude: number
}

interface SupabaseAuthResult {
  user: AuthenticatedUser | null
  backendUnavailable: boolean
}

interface LoginErrorResponse {
  error: string
  code: string
  retryAfterSeconds?: number
  remainingAttempts?: number
  redirectTo?: string
}

function buildLoginErrorResponse(
  status: number,
  body: LoginErrorResponse,
  options?: { requestId?: string; retryAfterSeconds?: number },
) {
  const response = NextResponse.json(body, { status })

  if (options?.requestId) {
    response.headers.set("X-Request-Id", options.requestId)
  }

  if (typeof options?.retryAfterSeconds === "number") {
    response.headers.set("Retry-After", String(options.retryAfterSeconds))
  }

  return response
}

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

function getFallbackAdminFromEnv() {
  const username = (
    process.env.ADMIN_FALLBACK_USERNAME ?? process.env.CALCULATOR_USERNAME
  )?.trim()
  const password = (
    process.env.ADMIN_FALLBACK_PASSWORD ?? process.env.CALCULATOR_PASSWORD
  )?.trim()

  if (!username || !password) {
    return null
  }

  return {
    id: (process.env.ADMIN_FALLBACK_ID ?? FALLBACK_ADMIN_DEFAULT_ID).trim(),
    username,
    password,
    role: "admin" as const,
  }
}

function isFallbackAdminEnabled() {
  if (process.env.NODE_ENV !== "production") {
    return true
  }

  return (process.env.ALLOW_FALLBACK_ADMIN || "").trim().toLowerCase() === "true"
}

function constantTimeEqual(left: string, right: string) {
  const leftHash = createHash("sha256").update(left).digest()
  const rightHash = createHash("sha256").update(right).digest()
  return timingSafeEqual(leftHash, rightHash)
}

function parseLoginLocation(value: unknown): LoginLocation | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as { latitude?: unknown; longitude?: unknown }
  const latitude = normalizeCoordinate(candidate.latitude, -90, 90)
  const longitude = normalizeCoordinate(candidate.longitude, -180, 180)

  if (latitude === null || longitude === null) {
    return null
  }

  return {
    latitude,
    longitude,
  }
}

async function authenticateWithSupabase(
  username: string,
  password: string,
  ip: string,
  location: LoginLocation | null,
): Promise<SupabaseAuthResult> {
  try {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("users")
      .select("id, username, role, password_hash")
      .eq("username", username)
      .eq("ativo", true)
      .single()

    if (error || !data) {
      const isNotFound = error?.code === "PGRST116"
      if (!isNotFound && error) {
        appLogger.warn("Falha ao consultar usuario no Supabase durante login", {
          route: "/api/auth/login",
          username,
          error,
        })
      }
      return {
        user: null,
        backendUnavailable: !isNotFound,
      }
    }

    const user = data as SupabaseUserRow
    const passwordCheck = await verifyPassword(password, user.password_hash)

    if (!passwordCheck.valid) {
      return { user: null, backendUnavailable: false }
    }

    const nextPasswordHash = passwordCheck.needsRehash
      ? await hashPassword(password)
      : user.password_hash

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: nextPasswordHash,
        ultimo_login: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      appLogger.warn("Falha ao atualizar metadados de login no Supabase", {
        route: "/api/auth/login",
        userId: user.id,
        error: updateError,
      })
    }

    try {
      const { error: activityError } = await supabase.from("activity_logs").insert({
        user_id: user.id,
        username: user.username,
        action: "Login",
        details: `Login no sistema`,
        page: "/login",
        ip_address: ip,
        latitude: location?.latitude ?? null,
        longitude: location?.longitude ?? null,
      })

      if (activityError) {
        appLogger.warn("Falha ao registrar log de login no Supabase", {
          route: "/api/auth/login",
          userId: user.id,
          error: activityError,
        })
      }
    } catch (error) {
      appLogger.warn("Excecao ao registrar log de login", {
        route: "/api/auth/login",
        userId: user.id,
        error,
      })
    }

    return {
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      } satisfies AuthenticatedUser,
      backendUnavailable: false,
    }
  } catch (error) {
    appLogger.error("Excecao na autenticacao via Supabase", {
      route: "/api/auth/login",
      username,
      error,
    })
    return { user: null, backendUnavailable: true }
  }
}

function authenticateWithFallback(
  fallback: { id: string; username: string; password: string; role: "admin" } | null,
  username: string,
  password: string,
) {
  if (!fallback) {
    return null
  }

  const isUsernameValid = constantTimeEqual(fallback.username, username)
  const isPasswordValid = constantTimeEqual(fallback.password, password)

  if (!isUsernameValid || !isPasswordValid) {
    return null
  }

  return {
    id: fallback.id,
    username: fallback.username,
    role: fallback.role,
  } satisfies AuthenticatedUser
}

function getRetryAfterSecondsForBlockedAttempt(
  registry: Map<string, { count: number; lastAttempt: number; blocked: boolean }>,
  key: string,
  now: number,
) {
  const attempts = registry.get(key)
  if (!attempts) {
    return null
  }

  const elapsedMs = now - attempts.lastAttempt
  if (elapsedMs > AUTH_LOGIN_BLOCK_WINDOW_MS) {
    registry.delete(key)
    return null
  }

  if (attempts.blocked || attempts.count >= AUTH_LOGIN_MAX_ATTEMPTS) {
    registry.set(key, { ...attempts, blocked: true, lastAttempt: now })
    const remainingMs = Math.max(0, AUTH_LOGIN_BLOCK_WINDOW_MS - elapsedMs)
    return Math.max(1, Math.ceil(remainingMs / 1000))
  }

  return null
}

function registerFailedAttempt(
  registry: Map<string, { count: number; lastAttempt: number; blocked: boolean }>,
  key: string,
  now: number,
) {
  const currentAttempts = registry.get(key) ?? { count: 0, lastAttempt: now, blocked: false }
  registry.set(key, {
    count: currentAttempts.count + 1,
    lastAttempt: now,
    blocked: currentAttempts.count + 1 >= AUTH_LOGIN_MAX_ATTEMPTS,
  })
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const startedAt = Date.now()
  const sameOriginError = enforceSameOrigin(request, "/api/auth/login")
  if (sameOriginError) {
    return sameOriginError
  }

  const now = Date.now()
  const ip = getClientIp(request)

  const blockedIpRetryAfter = getRetryAfterSecondsForBlockedAttempt(loginAttemptsByIp, ip, now)
  if (blockedIpRetryAfter !== null) {
    appLogger.warn("Tentativa de login bloqueada por limite de tentativas", {
      route: "/api/auth/login",
      requestId,
      ip,
      scope: "ip",
      retryAfterSeconds: blockedIpRetryAfter,
    })
    recordAuthMetric("login_rate_limited", {
      requestId,
      code: "RATE_LIMITED",
      latencyMs: Date.now() - startedAt,
    })
    return buildLoginErrorResponse(
      429,
      {
        error: `Muitas tentativas de login. Aguarde ${blockedIpRetryAfter} segundos.`,
        code: "RATE_LIMITED",
        retryAfterSeconds: blockedIpRetryAfter,
        remainingAttempts: 0,
        redirectTo: "/login",
      },
      {
        requestId,
        retryAfterSeconds: blockedIpRetryAfter,
      },
    )
  }

  if (!isJwtSecretConfigured()) {
    return buildLoginErrorResponse(
      503,
      {
        error: "JWT_SECRET nao configurado no ambiente.",
        code: AUTH_ERROR_CODES.jwtNotConfigured,
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  const { data: body, error: parseError } = await parseJsonBodyWithLimit<{
    username?: string
    password?: string
    location?: unknown
  }>(request, MAX_LOGIN_PAYLOAD_BYTES, "/api/auth/login")
  if (parseError) {
    return parseError
  }

  const username = sanitizePlainText(body?.username ?? "", 64)
  const password = body?.password
  const location = parseLoginLocation(body?.location)

  if (!username || !password) {
    return buildLoginErrorResponse(
      400,
      {
        error: "Usuario e senha sao obrigatorios",
        code: "MISSING_CREDENTIALS",
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  if (!isValidUsername(username)) {
    return buildLoginErrorResponse(
      400,
      {
        error: "Usuario invalido. Use apenas letras, numeros, ponto, traco e underscore.",
        code: "INVALID_USERNAME",
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  if (!validatePasswordLength(password)) {
    return buildLoginErrorResponse(
      400,
      {
        error: "Senha invalida (tamanho fora do permitido)",
        code: "INVALID_PASSWORD_LENGTH",
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  const usernameKey = username.toLowerCase()
  const blockedUsernameRetryAfter = getRetryAfterSecondsForBlockedAttempt(loginAttemptsByUsername, usernameKey, now)
  if (blockedUsernameRetryAfter !== null) {
    appLogger.warn("Tentativa de login bloqueada por limite de tentativas", {
      route: "/api/auth/login",
      ip,
      username,
      scope: "username",
      retryAfterSeconds: blockedUsernameRetryAfter,
    })
    recordAuthMetric("login_rate_limited", {
      requestId,
      username,
      code: "RATE_LIMITED",
      latencyMs: Date.now() - startedAt,
    })
    return buildLoginErrorResponse(
      429,
      {
        error: `Muitas tentativas de login. Aguarde ${blockedUsernameRetryAfter} segundos.`,
        code: "RATE_LIMITED",
        retryAfterSeconds: blockedUsernameRetryAfter,
        remainingAttempts: 0,
        redirectTo: "/login",
      },
      {
        requestId,
        retryAfterSeconds: blockedUsernameRetryAfter,
      },
    )
  }

  const fallbackEnabled = isFallbackAdminEnabled()
  const envFallbackAdmin = getFallbackAdminFromEnv()
  const fallbackAdmin = fallbackEnabled ? envFallbackAdmin : null
  if (!fallbackEnabled && envFallbackAdmin) {
    appLogger.warn("Fallback admin desativado em producao por politica de seguranca", {
      route: "/api/auth/login",
      requestId,
      nodeEnv: process.env.NODE_ENV || "unknown",
    })
  }
  const hasSupabaseAuth = isSupabasePublicConfigured()

  if (!hasSupabaseAuth && !fallbackAdmin) {
    appLogger.error("Nenhum backend de autenticacao configurado", {
      route: "/api/auth/login",
      requestId,
      fallbackDisabledInProduction:
        process.env.NODE_ENV === "production" && !fallbackEnabled,
    })
    return buildLoginErrorResponse(
      503,
      {
        error: "Nenhum backend de autenticacao configurado (Supabase ou fallback admin habilitado).",
        code: "AUTH_BACKEND_NOT_CONFIGURED",
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  const supabaseResult = hasSupabaseAuth
    ? await authenticateWithSupabase(username, password, ip, location)
    : { user: null, backendUnavailable: false }

  const fallbackUser = supabaseResult.user ? null : authenticateWithFallback(fallbackAdmin, username, password)
  const user = supabaseResult.user ?? fallbackUser

  if (!user) {
    if (supabaseResult.backendUnavailable && !fallbackAdmin) {
      appLogger.error("Backend de autenticacao indisponivel", {
        route: "/api/auth/login",
        requestId,
        ip,
        username,
      })
      return buildLoginErrorResponse(
        503,
        {
          error: "Servico de autenticacao indisponivel no momento.",
          code: "AUTH_BACKEND_UNAVAILABLE",
          redirectTo: "/login",
        },
        {
          requestId,
        },
      )
    }

    const nextAttemptCount = (loginAttemptsByUsername.get(usernameKey)?.count || 0) + 1
    const remainingAttempts = Math.max(0, AUTH_LOGIN_MAX_ATTEMPTS - nextAttemptCount)

    registerFailedAttempt(loginAttemptsByIp, ip, now)
    registerFailedAttempt(loginAttemptsByUsername, usernameKey, now)

    const exceededLimit = remainingAttempts === 0
    if (exceededLimit) {
      recordAuthMetric("login_rate_limited", {
        requestId,
        username,
        code: "RATE_LIMITED",
        latencyMs: Date.now() - startedAt,
      })
      return buildLoginErrorResponse(
        429,
        {
          error: `Muitas tentativas de login. Aguarde ${AUTH_LOGIN_BLOCK_WINDOW_SECONDS} segundos.`,
          code: "RATE_LIMITED",
          retryAfterSeconds: AUTH_LOGIN_BLOCK_WINDOW_SECONDS,
          remainingAttempts: 0,
          redirectTo: "/login",
        },
        {
          requestId,
          retryAfterSeconds: AUTH_LOGIN_BLOCK_WINDOW_SECONDS,
        },
      )
    }

    appLogger.warn("Falha de autenticacao por credenciais invalidas", {
      route: "/api/auth/login",
      requestId,
      ip,
      username,
    })
    recordAuthMetric("login_failed", {
      requestId,
      username,
      code: AUTH_ERROR_CODES.invalidCredentials,
      latencyMs: Date.now() - startedAt,
    })
    return buildLoginErrorResponse(
      401,
      {
        error: "Credenciais invalidas",
        code: AUTH_ERROR_CODES.invalidCredentials,
        remainingAttempts,
        redirectTo: "/login",
      },
      {
        requestId,
      },
    )
  }

  loginAttemptsByIp.delete(ip)
  loginAttemptsByUsername.delete(usernameKey)
  appLogger.info("Login realizado com sucesso", {
    route: "/api/auth/login",
    requestId,
    userId: user.id,
    username: user.username,
    role: user.role,
    source: supabaseResult.user ? "supabase" : "fallback",
  })
  recordAuthMetric("login_success", {
    requestId,
    username: user.username,
    role: user.role,
    source: supabaseResult.user ? "supabase" : "fallback",
    latencyMs: Date.now() - startedAt,
  })

  const token = await signAuthToken({
    id: user.id,
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  const expiresAt = new Date(Date.now() + AUTH_SESSION_TTL_SECONDS * 1000).toISOString()
  const redirectTo = resolvePostLoginRedirect({ role: user.role })

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role },
    redirectTo,
    expiresAt,
    sessionStatus: "authenticated",
  })

  if (requestId) {
    response.headers.set("X-Request-Id", requestId)
  }

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_SESSION_TTL_SECONDS,
    path: "/",
  })

  return response
}
