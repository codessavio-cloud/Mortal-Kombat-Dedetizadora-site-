import { NextResponse } from "next/server"

import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { createServiceSupabaseClient, isAbortError } from "@/lib/supabase/service"

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

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const admin = await requireAdmin()
  if (admin instanceof Response) {
    return admin
  }

  const supabase = createServiceSupabaseClient()
  if (!supabase) {
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }

  try {
    const [usersCount, activityCount, orcamentosCount] = await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("activity_logs").select("*", { count: "exact", head: true }),
      supabase.from("orcamentos").select("*", { count: "exact", head: true }),
    ])

    const totalRecords = (usersCount.count || 0) + (activityCount.count || 0) + (orcamentosCount.count || 0)
    const estimatedSizeKB = totalRecords * 0.5

    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const { count: logsLast7Days } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo.toISOString())

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const { count: logsToday } = await supabase
      .from("activity_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", today.toISOString())

    return NextResponse.json({
      tables: {
        users: usersCount.count || 0,
        activity_logs: activityCount.count || 0,
        orcamentos: orcamentosCount.count || 0,
      },
      totalRecords,
      estimatedSizeKB: Math.round(estimatedSizeKB * 100) / 100,
      estimatedSizeMB: Math.round((estimatedSizeKB / 1024) * 100) / 100,
      logsLast7Days: logsLast7Days || 0,
      logsToday: logsToday || 0,
      maxFreeRecords: 500000,
      usagePercent: Math.round((totalRecords / 500000) * 100 * 100) / 100,
    })
  } catch (error) {
    if (isAbortError(error)) {
      appLogger.warn("Timeout ao consultar estatisticas do banco", {
        route: "/api/db/stats",
        requestId,
        adminId: admin.userId,
        error,
      })
      return apiError(504, "Tempo limite ao consultar Supabase", "SUPABASE_TIMEOUT")
    }
    appLogger.error("Falha inesperada ao consultar estatisticas do banco", {
      route: "/api/db/stats",
      requestId,
      adminId: admin.userId,
      error,
    })
    return apiError(500, "Erro ao obter estatisticas", "DB_STATS_FAILED")
  }
}
