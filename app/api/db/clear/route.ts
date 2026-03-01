import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { parseJsonBodyWithLimit } from "@/lib/security/body"
import { enforceSameOrigin } from "@/lib/security/request"
import { createServiceSupabaseClient, isAbortError } from "@/lib/supabase/service"

interface ClearPayload {
  table?: "activity_logs" | "orcamentos"
  olderThanDays?: number
}
const MAX_CLEAR_PAYLOAD_BYTES = 4 * 1024

async function requireAdmin() {
  if (!isJwtSecretConfigured()) {
    return apiError(
      503,
      "JWT_SECRET nao configurado no ambiente.",
      AUTH_ERROR_CODES.jwtNotConfigured,
    )
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError(401, "Nao autorizado", AUTH_ERROR_CODES.notAuthenticated)
  }

  if (user.role !== "admin") {
    return apiError(403, "Acesso negado", AUTH_ERROR_CODES.forbidden)
  }

  return user
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const sameOriginError = enforceSameOrigin(request, "/api/db/clear")
  if (sameOriginError) {
    return sameOriginError
  }

  const admin = await requireAdmin()
  if (admin instanceof Response) {
    return admin
  }

  const supabase = createServiceSupabaseClient()
  if (!supabase) {
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }

  const { data: body, error: parseError } = await parseJsonBodyWithLimit<ClearPayload>(
    request,
    MAX_CLEAR_PAYLOAD_BYTES,
    "/api/db/clear",
    { allowMissingContentTypeForEmptyBody: true },
  )
  if (parseError) {
    return parseError
  }

  if (!body?.table || (body.table !== "activity_logs" && body.table !== "orcamentos")) {
    return apiError(400, "Tabela invalida", "INVALID_TABLE")
  }

  if (
    body.olderThanDays !== undefined &&
    (!Number.isFinite(body.olderThanDays) || body.olderThanDays <= 0 || body.olderThanDays > 3650)
  ) {
    return apiError(400, "olderThanDays invalido", "INVALID_OLDER_THAN_DAYS")
  }

  try {
    if (body.table === "activity_logs") {
      if (typeof body.olderThanDays === "number") {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - body.olderThanDays)

        const { data, error } = await supabase
          .from("activity_logs")
          .delete()
          .lt("created_at", cutoffDate.toISOString())
          .select("id")

        if (error) {
          appLogger.error("Falha ao limpar logs antigos", {
            route: "/api/db/clear",
            requestId,
            adminId: admin.userId,
            olderThanDays: body.olderThanDays,
            error,
          })
          return apiError(500, "Erro ao limpar dados", "DB_CLEAR_FAILED")
        }

        const removedCount = data?.length ?? 0
        const { error: activityError } = await supabase.from("activity_logs").insert({
          username: admin.username,
          action: `Limpou logs mais antigos que ${body.olderThanDays} dias`,
          details: `${removedCount} registros removidos`,
          page: "/admin",
        })

        if (activityError) {
          appLogger.warn("Falha ao registrar atividade de limpeza de logs antigos", {
            route: "/api/db/clear",
            requestId,
            adminId: admin.userId,
            error: activityError,
          })
        }

        appLogger.info("Limpeza de logs antigos concluida", {
          route: "/api/db/clear",
          requestId,
          adminId: admin.userId,
          olderThanDays: body.olderThanDays,
          removedCount,
        })

        return Response.json({
          success: true,
          message: `${removedCount} registros de atividade removidos`,
        })
      }

      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const { data, error } = await supabase
        .from("activity_logs")
        .delete()
        .lt("created_at", today.toISOString())
        .select("id")

      if (error) {
        appLogger.error("Falha ao limpar todos os logs antigos", {
          route: "/api/db/clear",
          requestId,
          adminId: admin.userId,
          error,
        })
        return apiError(500, "Erro ao limpar dados", "DB_CLEAR_FAILED")
      }

      const removedCount = data?.length ?? 0
      const { error: activityError } = await supabase.from("activity_logs").insert({
        username: admin.username,
        action: "Limpou todos os logs antigos",
        details: `${removedCount} registros removidos`,
        page: "/admin",
      })

      if (activityError) {
        appLogger.warn("Falha ao registrar atividade de limpeza total de logs", {
          route: "/api/db/clear",
          requestId,
          adminId: admin.userId,
          error: activityError,
        })
      }

      appLogger.info("Limpeza total de logs antigos concluida", {
        route: "/api/db/clear",
        requestId,
        adminId: admin.userId,
        removedCount,
      })

      return Response.json({
        success: true,
        message: `${removedCount} registros de atividade removidos`,
      })
    }

    const { data, error } = await supabase
      .from("orcamentos")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .select("id")

    if (error) {
      appLogger.error("Falha ao limpar orcamentos", {
        route: "/api/db/clear",
        requestId,
        adminId: admin.userId,
        error,
      })
      return apiError(500, "Erro ao limpar dados", "DB_CLEAR_FAILED")
    }

    const removedCount = data?.length ?? 0
    const { error: activityError } = await supabase.from("activity_logs").insert({
      username: admin.username,
      action: "Limpou todos os orcamentos",
      details: `${removedCount} orcamentos removidos`,
      page: "/admin",
    })

    if (activityError) {
      appLogger.warn("Falha ao registrar atividade de limpeza de orcamentos", {
        route: "/api/db/clear",
        requestId,
        adminId: admin.userId,
        error: activityError,
      })
    }

    appLogger.info("Limpeza de orcamentos concluida", {
      route: "/api/db/clear",
      requestId,
      adminId: admin.userId,
      removedCount,
    })

    return Response.json({
      success: true,
      message: `${removedCount} orcamentos removidos`,
    })
  } catch (error) {
    if (isAbortError(error)) {
      appLogger.warn("Timeout ao executar limpeza de dados", {
        route: "/api/db/clear",
        requestId,
        adminId: admin.userId,
        table: body.table,
        error,
      })
      return apiError(504, "Tempo limite ao consultar Supabase", "SUPABASE_TIMEOUT")
    }
    appLogger.error("Falha inesperada ao executar limpeza de dados", {
      route: "/api/db/clear",
      requestId,
      adminId: admin.userId,
      table: body.table,
      error,
    })
    return apiError(500, "Erro ao limpar dados", "DB_CLEAR_FAILED")
  }
}
