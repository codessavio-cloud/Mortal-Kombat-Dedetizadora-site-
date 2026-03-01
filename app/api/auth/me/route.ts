import { NextResponse } from "next/server"

import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { recordAuthMetric } from "@/lib/observability/auth-metrics"
import { toIsoFromUnixTimestamp } from "@/lib/auth/session-utils"

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const startedAt = Date.now()

  if (!isJwtSecretConfigured()) {
    recordAuthMetric("session_check_failed", {
      requestId,
      code: AUTH_ERROR_CODES.jwtNotConfigured,
      latencyMs: Date.now() - startedAt,
    })
    return apiError(
      503,
      "JWT_SECRET nao configurado no ambiente.",
      AUTH_ERROR_CODES.jwtNotConfigured,
      { sessionStatus: "unauthenticated" },
      requestId,
    )
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    recordAuthMetric("session_check_failed", {
      requestId,
      code: AUTH_ERROR_CODES.notAuthenticated,
      latencyMs: Date.now() - startedAt,
    })

    const response = NextResponse.json({
      user: null,
      expiresAt: null,
      sessionStatus: "unauthenticated",
      code: AUTH_ERROR_CODES.notAuthenticated,
    })

    if (requestId) {
      response.headers.set("X-Request-Id", requestId)
    }

    return response
  }

  recordAuthMetric("session_check_success", {
    requestId,
    username: user.username,
    role: user.role,
    latencyMs: Date.now() - startedAt,
  })

  const response = NextResponse.json({
    user: {
      id: user.userId,
      username: user.username,
      role: user.role,
    },
    expiresAt: toIsoFromUnixTimestamp(user.exp),
    sessionStatus: "authenticated",
  })

  if (requestId) {
    response.headers.set("X-Request-Id", requestId)
  }

  return response
}
