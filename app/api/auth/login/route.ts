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
import { apiError } from "@/lib/api/response"
import { appLogger } from "@/lib/observability/logger"
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

function getClientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
}

function getFallbackAdminFromEnv() {
  const username = process.env.ADMIN_FALLBACK_USERNAME ?? process.env.CALCULATOR_USERNAME
  const password = process.env.ADMIN_FALLBACK_PASSWORD ?? process.env.CALCULATOR_PASSWORD

  if (!username || !password) {
    return null
  }

  return {
    id: process.env.ADMIN_FALLBACK_ID ?? FALLBACK_ADMIN_DEFAULT_ID,
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

function shouldBlockAttempt(
  registry: Map<string, { count: number; lastAttempt: number; blocked: boolean }>,
  key: string,
  now: number,
) {
  const attempts = registry.get(key)
  if (!attempts) {
    return false
  }

  if (now - attempts.lastAttempt > AUTH_LOGIN_BLOCK_WINDOW_MS) {
    registry.delete(key)
    return false
  }

  if (attempts.blocked || attempts.count >= AUTH_LOGIN_MAX_ATTEMPTS) {
    registry.set(key, { ...attempts, blocked: true, lastAttempt: now })
    return true
  }

  return false
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
  const sameOriginError = enforceSameOrigin(request, "/api/auth/login")
  if (sameOriginError) {
    return sameOriginError
  }

  const now = Date.now()
  const ip = getClientIp(request)

  if (shouldBlockAttempt(loginAttemptsByIp, ip, now)) {
    appLogger.warn("Tentativa de login bloqueada por limite de tentativas", {
      route: "/api/auth/login",
      requestId,
      ip,
      scope: "ip",
    })
    return apiError(
      429,
      `Muitas tentativas de login. Aguarde ${AUTH_LOGIN_BLOCK_WINDOW_SECONDS} segundos.`,
      "RATE_LIMITED",
    )
  }

  if (!isJwtSecretConfigured()) {
    return apiError(
      503,
      "JWT_SECRET nao configurado no ambiente.",
      AUTH_ERROR_CODES.jwtNotConfigured,
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
    return apiError(400, "Usuario e senha sao obrigatorios", "MISSING_CREDENTIALS")
  }

  if (!isValidUsername(username)) {
    return apiError(
      400,
      "Usuario invalido. Use apenas letras, numeros, ponto, traco e underscore.",
      "INVALID_USERNAME",
    )
  }

  if (!validatePasswordLength(password)) {
    return apiError(400, "Senha invalida (tamanho fora do permitido)", "INVALID_PASSWORD_LENGTH")
  }

  const usernameKey = username.toLowerCase()
  if (shouldBlockAttempt(loginAttemptsByUsername, usernameKey, now)) {
    appLogger.warn("Tentativa de login bloqueada por limite de tentativas", {
      route: "/api/auth/login",
      ip,
      username,
      scope: "username",
    })
    return apiError(
      429,
      `Muitas tentativas de login. Aguarde ${AUTH_LOGIN_BLOCK_WINDOW_SECONDS} segundos.`,
      "RATE_LIMITED",
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
    return apiError(
      503,
      "Nenhum backend de autenticacao configurado (Supabase ou fallback admin habilitado).",
      "AUTH_BACKEND_NOT_CONFIGURED",
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
      return apiError(
        503,
        "Servico de autenticacao indisponivel no momento.",
        "AUTH_BACKEND_UNAVAILABLE",
      )
    }

    registerFailedAttempt(loginAttemptsByIp, ip, now)
    registerFailedAttempt(loginAttemptsByUsername, usernameKey, now)
    appLogger.warn("Falha de autenticacao por credenciais invalidas", {
      route: "/api/auth/login",
      requestId,
      ip,
      username,
    })
    return apiError(401, "Credenciais invalidas", AUTH_ERROR_CODES.invalidCredentials)
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

  const token = await signAuthToken({
    id: user.id,
    userId: user.id,
    username: user.username,
    role: user.role,
  })

  const response = NextResponse.json({
    success: true,
    user: { id: user.id, username: user.username, role: user.role },
  })

  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AUTH_SESSION_TTL_SECONDS,
    path: "/",
  })

  return response
}
