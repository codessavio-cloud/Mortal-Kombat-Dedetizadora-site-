import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

import {
  AUTH_BLOCKED_IP_TTL_MS,
  AUTH_COOKIE_NAME,
  AUTH_ERROR_CODES,
} from "@/lib/auth/constants"
import { isJwtSecretConfigured, verifyAuthToken } from "@/lib/auth/jwt"
import { appLogger } from "@/lib/observability/logger"
import { applySecurityHeaders, getOrCreateRequestId } from "@/lib/security/http-headers"
import { checkRateLimit, pruneRateLimitStore } from "@/lib/security/rate-limit"

const blockedIPs = new Map<string, number>()
const suspiciousActivity = new Map<string, { count: number; lastActivity: number }>()
const MAX_SECURITY_MAP_ENTRIES = 10_000

const suspiciousPatterns = [
  /sqlmap/i,
  /union.*select/i,
  /insert.*into/i,
  /drop.*table/i,
  /delete.*from/i,
  /or\s+1\s*=\s*1/i,
  /and\s+1\s*=\s*1/i,
  /'\s*or\s*'/i,
  /;\s*--/i,
  /<script>/i,
  /javascript:/i,
  /on\w+\s*=/i,
  /eval\s*\(/i,
  /\.\.\//i,
  /\.\.%2f/i,
  /\.\.%5c/i,
  /nikto/i,
  /nmap/i,
  /masscan/i,
  /dirbuster/i,
  /gobuster/i,
  /wfuzz/i,
  /havij/i,
  /acunetix/i,
  /netsparker/i,
  /burpsuite/i,
  /__proto__/i,
  /constructor\[/i,
  /prototype\[/i,
]

const suspiciousHintTokens = [
  "'",
  ";",
  "<",
  ">",
  "..",
  "%2f",
  "%5c",
  "javascript:",
  "script",
  "sql",
  "union",
  "drop",
  "insert",
  "delete",
  "eval(",
  "__proto__",
  "constructor[",
  "prototype[",
  "sqlmap",
  "nikto",
  "nmap",
  "masscan",
  "dirbuster",
  "gobuster",
  "wfuzz",
  "havij",
  "acunetix",
  "netsparker",
  "burpsuite",
]

const idorPatterns = [
  /\/users\/[0-9a-f-]{8,}/i,
  /\/api\/[^?#]+\/[0-9a-f-]{8,}/i,
  /id=[0-9a-f-]{8,}/i,
  /user_id=[0-9a-f-]{8,}/i,
]

function isSuspiciousRequest(request: NextRequest): boolean {
  const url = request.url.toLowerCase()
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase()
  const requestFingerprint = `${url} ${userAgent}`

  const shouldDeepScan = suspiciousHintTokens.some((token) => requestFingerprint.includes(token))
  if (!shouldDeepScan) {
    return false
  }

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(requestFingerprint)) {
      return true
    }
  }
  return false
}

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  )
}

function secureResponse(response: NextResponse, requestId: string, rateLimitRemaining?: number | null) {
  return applySecurityHeaders(response, { requestId, rateLimitRemaining })
}

function apiErrorResponse(
  status: number,
  error: string,
  code: string,
  requestId: string,
  headers?: Record<string, string>,
  rateLimitRemaining?: number | null,
  bodyExtras?: Record<string, unknown>,
) {
  const response = NextResponse.json(
    {
      error,
      code,
      ...(bodyExtras || {}),
    },
    {
      status,
      headers,
    },
  )

  return secureResponse(response, requestId, rateLimitRemaining)
}

function detectIDORBehavior(ip: string, url: string): boolean {
  const normalizedUrl = url.toLowerCase()
  if (
    !normalizedUrl.includes("/users/") &&
    !normalizedUrl.includes("/api/") &&
    !normalizedUrl.includes("id=") &&
    !normalizedUrl.includes("user_id=")
  ) {
    return false
  }

  const now = Date.now()

  for (const pattern of idorPatterns) {
    if (pattern.test(normalizedUrl)) {
      const record = suspiciousActivity.get(ip)

      if (!record) {
        suspiciousActivity.set(ip, { count: 1, lastActivity: now })
        return false
      }

      if (now - record.lastActivity < 10000) {
        record.count++
        if (record.count > 20) {
          return true
        }
      } else {
        record.count = 1
        record.lastActivity = now
      }
    }
  }

  return false
}

function pruneSecurityState(now: number) {
  pruneRateLimitStore(now)

  if (
    blockedIPs.size > MAX_SECURITY_MAP_ENTRIES ||
    suspiciousActivity.size > MAX_SECURITY_MAP_ENTRIES
  ) {
    appLogger.warn("Estado de seguranca reiniciado por volume elevado de chaves em memoria", {
      route: "proxy",
      blockedIPs: blockedIPs.size,
      suspiciousActivity: suspiciousActivity.size,
    })
    blockedIPs.clear()
    suspiciousActivity.clear()
    return
  }

  for (const [ip, blockedUntil] of blockedIPs.entries()) {
    if (blockedUntil <= now) {
      blockedIPs.delete(ip)
    }
  }

  for (const [key, activity] of suspiciousActivity.entries()) {
    if (now - activity.lastActivity > 30_000) {
      suspiciousActivity.delete(key)
    }
  }
}

function isIpBlocked(ip: string, now: number) {
  const blockedUntil = blockedIPs.get(ip)
  if (!blockedUntil) {
    return false
  }

  if (blockedUntil <= now) {
    blockedIPs.delete(ip)
    return false
  }

  return true
}

function blockIp(ip: string, now: number) {
  blockedIPs.set(ip, now + AUTH_BLOCKED_IP_TTL_MS)
}

function releaseBlockedIp(ip: string, requestId: string, pathname: string, reason: string) {
  blockedIPs.delete(ip)
  suspiciousActivity.delete(ip)
  appLogger.warn("Bloqueio de IP liberado automaticamente", {
    route: "proxy",
    requestId,
    ip,
    pathname,
    reason,
  })
}

function buildLoginRedirectUrl(request: NextRequest) {
  const loginUrl = new URL("/login", request.url)
  const requestedPath = `${request.nextUrl.pathname}${request.nextUrl.search}`

  if (requestedPath !== "/login" && requestedPath.startsWith("/") && !requestedPath.startsWith("//")) {
    loginUrl.searchParams.set("next", requestedPath)
  }

  return loginUrl
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIP(request)
  const now = Date.now()
  const requestId = getOrCreateRequestId(request)
  let rateLimitRemaining: number | null = null

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set("x-request-id", requestId)

  const nextResponse = () =>
    secureResponse(
      NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      }),
      requestId,
      rateLimitRemaining,
    )

  pruneSecurityState(now)

  if (isIpBlocked(ip, now)) {
    const blockedToken = request.cookies.get(AUTH_COOKIE_NAME)
    if (blockedToken) {
      const blockedPayload = await verifyAuthToken(blockedToken.value)
      if (blockedPayload) {
        releaseBlockedIp(ip, requestId, pathname, "authenticated-session")
        return nextResponse()
      }
    }

    const isApiRoute = pathname.startsWith("/api/")
    const isAuthApiRoute = pathname.startsWith("/api/auth/")

    if (!isApiRoute || isAuthApiRoute) {
      releaseBlockedIp(ip, requestId, pathname, isAuthApiRoute ? "auth-api-route" : "human-navigation")
      if (isAuthApiRoute) {
        return nextResponse()
      }
      // Continue the normal middleware auth checks for page routes.
    } else {
      return apiErrorResponse(
        403,
        "Acesso bloqueado por atividade suspeita",
        "SUSPICIOUS_ACTIVITY_BLOCKED",
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }
  }

  if (isSuspiciousRequest(request)) {
    blockIp(ip, now)
    appLogger.warn("IP bloqueado por padrao suspeito", {
      route: "proxy",
      requestId,
      ip,
      pathname,
      userAgent: request.headers.get("user-agent") || "unknown",
    })

    if (pathname.startsWith("/api/")) {
      return apiErrorResponse(
        403,
        "Acesso bloqueado",
        "SUSPICIOUS_REQUEST_BLOCKED",
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }

    return secureResponse(new NextResponse("Acesso bloqueado", { status: 403 }), requestId, rateLimitRemaining)
  }

  if (detectIDORBehavior(ip, request.url)) {
    blockIp(ip, now)
    appLogger.warn("IP bloqueado por tentativa de IDOR", {
      route: "proxy",
      requestId,
      ip,
      pathname,
    })

    if (pathname.startsWith("/api/")) {
      return apiErrorResponse(
        403,
        "Acesso bloqueado",
        "IDOR_PATTERN_BLOCKED",
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }

    return secureResponse(new NextResponse("Acesso bloqueado", { status: 403 }), requestId, rateLimitRemaining)
  }

  if (pathname.startsWith("/api/")) {
    const rateLimit = checkRateLimit(ip, pathname, now)
    if (!rateLimit.allowed) {
      return apiErrorResponse(
        429,
        "Limite de requisicoes excedido. Aguarde.",
        "RATE_LIMITED",
        requestId,
        {
          "Retry-After": String(rateLimit.retryAfterSeconds),
          "X-RateLimit-Remaining": "0",
        },
        0,
        {
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
      )
    }
    rateLimitRemaining = rateLimit.remaining
  }

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth/login") ||
    pathname.startsWith("/api/auth/logout") ||
    pathname.startsWith("/api/auth/me")
  ) {
    return nextResponse()
  }

  if (!isJwtSecretConfigured()) {
    if (pathname.startsWith("/api/")) {
      return apiErrorResponse(
        503,
        "JWT_SECRET nao configurado no ambiente.",
        AUTH_ERROR_CODES.jwtNotConfigured,
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }

    return secureResponse(NextResponse.redirect(buildLoginRedirectUrl(request)), requestId, rateLimitRemaining)
  }

  if (pathname.startsWith("/api/") && pathname !== "/api/auth/login") {
    const token = request.cookies.get(AUTH_COOKIE_NAME)
    if (!token) {
      return apiErrorResponse(
        401,
        "Nao autorizado",
        AUTH_ERROR_CODES.notAuthenticated,
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }

    const payload = await verifyAuthToken(token.value)
    if (!payload) {
      return apiErrorResponse(
        401,
        "Token invalido",
        AUTH_ERROR_CODES.notAuthenticated,
        requestId,
        undefined,
        rateLimitRemaining,
      )
    }

    const issuedAtSeconds = payload.iat
    if (typeof issuedAtSeconds === "number") {
      const tokenAge = Date.now() - issuedAtSeconds * 1000
      if (tokenAge > 86_400_000) {
        return apiErrorResponse(
          401,
          "Sessao expirada",
          AUTH_ERROR_CODES.notAuthenticated,
          requestId,
          undefined,
          rateLimitRemaining,
        )
      }
    }

    if (payload.role !== "admin") {
      if (pathname.startsWith("/api/db/clear") || pathname.startsWith("/api/db/stats")) {
        return apiErrorResponse(
          403,
          "Acesso negado",
          AUTH_ERROR_CODES.forbidden,
          requestId,
          undefined,
          rateLimitRemaining,
        )
      }

      const isUsersCollectionRoute = pathname === "/api/users" || pathname === "/api/users/"
      if (isUsersCollectionRoute) {
        return apiErrorResponse(
          403,
          "Acesso negado",
          AUTH_ERROR_CODES.forbidden,
          requestId,
          undefined,
          rateLimitRemaining,
        )
      }

      const userIdMatch = pathname.match(/^\/api\/users\/([^/?#]+)$/)
      if (userIdMatch) {
        const requestedUserId = userIdMatch[1]
        const isOwnResource = requestedUserId === String(payload.userId)
        const isOwnPasswordUpdate = request.method === "PATCH" && isOwnResource

        if (!isOwnPasswordUpdate) {
          appLogger.warn("Tentativa de acesso indevido a recurso de usuario", {
            route: "proxy",
            requestId,
            actorUsername: payload.username,
            actorUserId: payload.userId,
            requestedUserId,
            method: request.method,
          })
          return apiErrorResponse(
            403,
            "Acesso negado ao recurso",
            AUTH_ERROR_CODES.forbidden,
            requestId,
            undefined,
            rateLimitRemaining,
          )
        }
      }
    }
  }

  const token = request.cookies.get(AUTH_COOKIE_NAME)
  if (!token) {
    return secureResponse(NextResponse.redirect(buildLoginRedirectUrl(request)), requestId, rateLimitRemaining)
  }

  const payload = await verifyAuthToken(token.value)
  if (!payload) {
    return secureResponse(NextResponse.redirect(buildLoginRedirectUrl(request)), requestId, rateLimitRemaining)
  }

  if (pathname === "/admin" && payload.role !== "admin") {
    return secureResponse(NextResponse.redirect(new URL("/", request.url)), requestId, rateLimitRemaining)
  }

  return nextResponse()
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/baratinha",
    "/barata-esgoto",
    "/aranha-mosquito-traca",
    "/pulga-carrapato-percevejo",
    "/formiga",
    "/escorpiao",
    "/escorpiao-formiga",
    "/cupim",
    "/rato",
    "/lei",
    "/admin",
    "/caixa-dagua",
    "/veiculos",
    "/atomizacao",
    "/falas",
    "/api/:path*",
  ],
}
