import { NextResponse } from "next/server"

import { AUTH_COOKIE_NAME } from "@/lib/auth/constants"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { enforceSameOrigin } from "@/lib/security/request"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const sameOriginError = enforceSameOrigin(request, "/api/auth/logout")
  if (sameOriginError) {
    return sameOriginError
  }

  const user = await getAuthenticatedUser()

  if (user) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.from("activity_logs").insert({
        user_id: user.userId,
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

  const response = NextResponse.json({ success: true })
  response.cookies.delete(AUTH_COOKIE_NAME)
  return response
}
