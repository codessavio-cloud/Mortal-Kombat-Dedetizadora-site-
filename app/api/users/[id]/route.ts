import { NextResponse } from "next/server"

import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { hashPassword } from "@/lib/auth/password"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { parseJsonBodyWithLimit } from "@/lib/security/body"
import { enforceSameOrigin } from "@/lib/security/request"
import { isValidUserId, validatePasswordLength } from "@/lib/security/validation"
import { createClient } from "@/lib/supabase/server"

const MAX_UPDATE_USER_PAYLOAD_BYTES = 8 * 1024

async function requireAuthUser() {
  if (!isJwtSecretConfigured()) {
    return apiError(
      503,
      "JWT_SECRET nao configurado no ambiente.",
      AUTH_ERROR_CODES.jwtNotConfigured,
    )
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError(401, "Nao autenticado", AUTH_ERROR_CODES.notAuthenticated)
  }

  return user
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") || undefined
  const sameOriginError = enforceSameOrigin(request, "/api/users/[id]")
  if (sameOriginError) {
    return sameOriginError
  }

  const authUser = await requireAuthUser()
  if (authUser instanceof Response) {
    return authUser
  }

  const { id } = await params
  if (!isValidUserId(id)) {
    return apiError(400, "ID de usuario invalido", "INVALID_USER_ID")
  }

  if (authUser.role !== "admin" && authUser.userId !== id) {
    return apiError(403, "Sem permissao", AUTH_ERROR_CODES.forbidden)
  }

  const { data: body, error: parseError } = await parseJsonBodyWithLimit<{ password?: string }>(
    request,
    MAX_UPDATE_USER_PAYLOAD_BYTES,
    "/api/users/[id]",
  )
  if (parseError) {
    return parseError
  }

  if (!body?.password || !validatePasswordLength(body.password)) {
    return apiError(400, "Senha invalida (tamanho fora do permitido)", "INVALID_PASSWORD_LENGTH")
  }

  try {
    const supabase = await createClient()
    const passwordHash = await hashPassword(body.password)

    const { data: updatedUser, error } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) {
      appLogger.error("Falha ao atualizar senha de usuario", {
        route: "/api/users/[id]",
        requestId,
        actorId: authUser.userId,
        targetUserId: id,
        error,
      })
      return apiError(500, "Nao foi possivel atualizar senha", "USER_PASSWORD_UPDATE_FAILED")
    }

    if (!updatedUser) {
      return apiError(404, "Usuario nao encontrado", "USER_NOT_FOUND")
    }

    const { error: activityError } = await supabase.from("activity_logs").insert({
      user_id: authUser.userId,
      username: authUser.username,
      action: "Alterou senha",
      details: `Alterou senha de usuario`,
      page: "/admin",
    })

    if (activityError) {
      appLogger.warn("Falha ao registrar atividade de alteracao de senha", {
        route: "/api/users/[id]",
        requestId,
        actorId: authUser.userId,
        targetUserId: id,
        error: activityError,
      })
    }

    appLogger.info("Senha atualizada com sucesso", {
      route: "/api/users/[id]",
      requestId,
      actorId: authUser.userId,
      targetUserId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    appLogger.warn("Supabase indisponivel ao atualizar senha", {
      route: "/api/users/[id]",
      requestId,
      actorId: authUser.userId,
      targetUserId: id,
      error,
    })
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const requestId = request.headers.get("x-request-id") || undefined
  const sameOriginError = enforceSameOrigin(request, "/api/users/[id]")
  if (sameOriginError) {
    return sameOriginError
  }

  const authUser = await requireAuthUser()
  if (authUser instanceof Response) {
    return authUser
  }

  if (authUser.role !== "admin") {
    return apiError(403, "Sem permissao", AUTH_ERROR_CODES.forbidden)
  }

  const { id } = await params
  if (!isValidUserId(id)) {
    return apiError(400, "ID de usuario invalido", "INVALID_USER_ID")
  }

  try {
    const supabase = await createClient()

    const { data: userToDelete, error: fetchUserError } = await supabase
      .from("users")
      .select("id, username, role, ativo")
      .eq("id", id)
      .maybeSingle()

    if (fetchUserError) {
      appLogger.error("Falha ao consultar usuario para exclusao", {
        route: "/api/users/[id]",
        requestId,
        actorId: authUser.userId,
        targetUserId: id,
        error: fetchUserError,
      })
      return apiError(500, "Nao foi possivel consultar usuario", "USER_FETCH_FAILED")
    }

    if (!userToDelete) {
      return apiError(404, "Usuario nao encontrado", "USER_NOT_FOUND")
    }

    if (!userToDelete.ativo) {
      return apiError(400, "Usuario ja esta inativo", "USER_ALREADY_INACTIVE")
    }

    if (userToDelete?.role === "admin") {
      return apiError(400, "Nao e possivel excluir administradores", "ADMIN_DELETE_BLOCKED")
    }

    const { data: deletedUser, error } = await supabase
      .from("users")
      .update({ ativo: false })
      .eq("id", id)
      .select("id")
      .maybeSingle()

    if (error) {
      appLogger.error("Falha ao inativar usuario", {
        route: "/api/users/[id]",
        requestId,
        actorId: authUser.userId,
        targetUserId: id,
        error,
      })
      return apiError(400, "Nao foi possivel excluir", "USER_DELETE_FAILED")
    }

    if (!deletedUser) {
      return apiError(404, "Usuario nao encontrado", "USER_NOT_FOUND")
    }

    const { error: activityError } = await supabase.from("activity_logs").insert({
      user_id: authUser.userId,
      username: authUser.username,
      action: "Excluiu funcionario",
      details: `Excluiu usuario: ${userToDelete?.username || id}`,
      page: "/admin",
    })

    if (activityError) {
      appLogger.warn("Falha ao registrar atividade de exclusao de usuario", {
        route: "/api/users/[id]",
        requestId,
        actorId: authUser.userId,
        targetUserId: id,
        error: activityError,
      })
    }

    appLogger.info("Usuario inativado com sucesso", {
      route: "/api/users/[id]",
      requestId,
      actorId: authUser.userId,
      targetUserId: id,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    appLogger.warn("Supabase indisponivel ao excluir usuario", {
      route: "/api/users/[id]",
      requestId,
      actorId: authUser.userId,
      targetUserId: id,
      error,
    })
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }
}
