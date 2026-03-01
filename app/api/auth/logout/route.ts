import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { recordAuthMetric } from "@/lib/observability/auth-metrics"
import { enforceSameOrigin } from "@/lib/security/request"
import { isUuid } from "@/lib/security/validation"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const startedAt = Date.now()
  const sameOriginError = enforceSameOrigin(request, "/api/auth/logout")
  if (sameOriginError) {
    return sameOriginError
  }

  const user = await getAuthenticatedUser()

  if (user) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from("activity_logs").insert({
        user_id: isUuid(user.userId) ? user.userId : null,
        username: user.username,
        action: "Logout",
        details: "Usuario fez logout do sistema",
        page: "/logout",
      })

      if (error) {
        appLogger.warn("Falha ao registrar logout no log de atividades", {
          route: "/api/auth/logout",
          requestId,
          userId: user.userId,
          error,
        })
      }
    } catch (error) {
      appLogger.warn("Excecao ao registrar logout no log de atividades", {
        route: "/api/auth/logout",
        requestId,
        userId: user.userId,
        error,
      })
    }
  }

  recordAuthMetric("logout", {
    requestId,
    username: user?.username,
    role: user?.role,
    latencyMs: Date.now() - startedAt,
  })

  const response = NextResponse.json({
    success: true,
    sessionStatus: "unauthenticated",
    redirectTo: "/login",
  })

  if (requestId) {
    response.headers.set("X-Request-Id", requestId)
  }

  response.cookies.delete(AUTH_COOKIE_NAME)
  return response
}
