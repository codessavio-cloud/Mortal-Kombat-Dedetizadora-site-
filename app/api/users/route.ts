import { NextResponse } from "next/server"

import { parseBooleanQueryParam, parseIntegerQueryParam, parseStringQueryParam } from "@/lib/api/query"
import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { hashPassword } from "@/lib/auth/password"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { parseJsonBodyWithLimit } from "@/lib/security/body"
import { enforceSameOrigin } from "@/lib/security/request"
import {
  isValidUsername,
  normalizeOptionalText,
  sanitizePlainText,
  validatePasswordLength,
} from "@/lib/security/validation"
import { createClient } from "@/lib/supabase/server"

const MAX_CREATE_USER_PAYLOAD_BYTES = 12 * 1024

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
    return apiError(401, "Nao autenticado", AUTH_ERROR_CODES.notAuthenticated)
  }

  if (user.role !== "admin") {
    return apiError(403, "Sem permissao", AUTH_ERROR_CODES.forbidden)
  }

  return user
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const admin = await requireAdmin()
  if (admin instanceof Response) {
    return admin
  }

  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const hasPaginationParams =
      searchParams.has("page") ||
      searchParams.has("pageSize") ||
      searchParams.has("search") ||
      searchParams.has("activeOnly")

    if (!hasPaginationParams) {
      const { data: users, error } = await supabase
        .from("users")
        .select("id, username, role, nome_completo, created_at, ultimo_login, ativo")
        .eq("ativo", true)
        .order("created_at", { ascending: false })

      if (error) {
        appLogger.error("Falha ao buscar usuarios ativos", {
          route: "/api/users",
          requestId,
          adminId: admin.userId,
          error,
        })
        return apiError(500, "Erro ao buscar usuarios", "USERS_FETCH_FAILED")
      }

      return NextResponse.json({ users: users || [] })
    }

    const pageResult = parseIntegerQueryParam(searchParams.get("page"), {
      name: "page",
      defaultValue: 1,
      min: 1,
      max: 10000,
    })
    if (pageResult.error) {
      return apiError(400, pageResult.error.error, pageResult.error.code, pageResult.error.details)
    }

    const pageSizeResult = parseIntegerQueryParam(searchParams.get("pageSize"), {
      name: "pageSize",
      defaultValue: 20,
      min: 1,
      max: 100,
    })
    if (pageSizeResult.error) {
      return apiError(400, pageSizeResult.error.error, pageSizeResult.error.code, pageSizeResult.error.details)
    }

    const searchResult = parseStringQueryParam(searchParams.get("search"), {
      name: "search",
      maxLength: 64,
    })
    if (searchResult.error) {
      return apiError(400, searchResult.error.error, searchResult.error.code, searchResult.error.details)
    }

    const activeOnlyResult = parseBooleanQueryParam(searchParams.get("activeOnly"), {
      name: "activeOnly",
      defaultValue: true,
    })
    if (activeOnlyResult.error) {
      return apiError(
        400,
        activeOnlyResult.error.error,
        activeOnlyResult.error.code,
        activeOnlyResult.error.details,
      )
    }

    const page = pageResult.value
    const pageSize = pageSizeResult.value
    const search = normalizeOptionalText(searchResult.value, 64)
    const activeOnly = activeOnlyResult.value
    const rangeFrom = (page - 1) * pageSize
    const rangeTo = rangeFrom + pageSize - 1

    let countQuery = supabase.from("users").select("*", { count: "exact", head: true })
    if (activeOnly) {
      countQuery = countQuery.eq("ativo", true)
    }
    if (search) {
      const pattern = `%${search.replace(/[%_(),]/g, " ").trim()}%`
      countQuery = countQuery.or(`username.ilike.${pattern},nome_completo.ilike.${pattern}`)
    }

    const { count, error: countError } = await countQuery
    if (countError) {
      appLogger.error("Falha ao contar usuarios para paginacao", {
        route: "/api/users",
        requestId,
        adminId: admin.userId,
        error: countError,
      })
      return apiError(500, "Erro ao buscar usuarios", "USERS_FETCH_FAILED")
    }

    let usersQuery = supabase
      .from("users")
      .select("id, username, role, nome_completo, created_at, ultimo_login, ativo")
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo)

    if (activeOnly) {
      usersQuery = usersQuery.eq("ativo", true)
    }
    if (search) {
      const pattern = `%${search.replace(/[%_(),]/g, " ").trim()}%`
      usersQuery = usersQuery.or(`username.ilike.${pattern},nome_completo.ilike.${pattern}`)
    }

    const { data: users, error } = await usersQuery

    if (error) {
      appLogger.error("Falha ao buscar usuarios ativos", {
        route: "/api/users",
        requestId,
        adminId: admin.userId,
        error,
      })
      return apiError(500, "Erro ao buscar usuarios", "USERS_FETCH_FAILED")
    }

    const total = count || 0
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    return NextResponse.json({
      users: users || [],
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  } catch (error) {
    appLogger.warn("Supabase indisponivel em listagem de usuarios", {
      route: "/api/users",
      requestId,
      adminId: admin.userId,
      error,
    })
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }
}

interface CreateUserPayload {
  username?: string
  password?: string
  role?: "admin" | "funcionario"
  nomeCompleto?: string
}

export async function POST(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined
  const sameOriginError = enforceSameOrigin(request, "/api/users")
  if (sameOriginError) {
    return sameOriginError
  }

  const admin = await requireAdmin()
  if (admin instanceof Response) {
    return admin
  }

  const { data: body, error: parseError } = await parseJsonBodyWithLimit<CreateUserPayload>(
    request,
    MAX_CREATE_USER_PAYLOAD_BYTES,
    "/api/users",
  )
  if (parseError) {
    return parseError
  }

  const username = sanitizePlainText(body?.username ?? "", 64)
  const password = body?.password
  const role = body?.role === "admin" ? "admin" : "funcionario"
  const nomeCompleto = normalizeOptionalText(body?.nomeCompleto, 120)

  if (!username || !password) {
    return apiError(400, "Usuario e senha sao obrigatorios", "MISSING_FIELDS")
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

  try {
    const supabase = await createClient()
    const { data: existing, error: existingError } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle()

    if (existingError) {
      appLogger.error("Falha ao validar conflito de usuario", {
        route: "/api/users",
        requestId,
        username,
        adminId: admin.userId,
        error: existingError,
      })
      return apiError(500, "Erro ao validar usuario existente", "USER_LOOKUP_FAILED")
    }

    if (existing) {
      appLogger.warn("Tentativa de criar usuario com username ja existente", {
        route: "/api/users",
        requestId,
        username,
        adminId: admin.userId,
      })
      return apiError(400, "Usuario ja existe", "USERNAME_CONFLICT")
    }

    const passwordHash = await hashPassword(password)

    const { data: newUser, error } = await supabase
      .from("users")
      .insert({
        username,
        password_hash: passwordHash,
        role,
        nome_completo: nomeCompleto,
      })
      .select("id, username, role, nome_completo, created_at, ultimo_login, ativo")
      .single()

    if (error || !newUser) {
      appLogger.error("Falha ao criar usuario", {
        route: "/api/users",
        requestId,
        username,
        role,
        adminId: admin.userId,
        error,
      })
      return apiError(500, "Erro ao criar usuario", "USER_CREATE_FAILED")
    }

    const { error: activityError } = await supabase.from("activity_logs").insert({
      user_id: admin.userId,
      username: admin.username,
      action: "Criou funcionario",
      details: `Criou usuario: ${username}`,
      page: "/admin",
    })

    if (activityError) {
      appLogger.warn("Falha ao registrar atividade de criacao de usuario", {
        route: "/api/users",
        requestId,
        adminId: admin.userId,
        username,
        error: activityError,
      })
    }

    appLogger.info("Usuario criado com sucesso", {
      route: "/api/users",
      requestId,
      adminId: admin.userId,
      username,
      role,
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    appLogger.warn("Supabase indisponivel ao criar usuario", {
      route: "/api/users",
      requestId,
      adminId: admin.userId,
      username,
      error,
    })
    return apiError(503, "Supabase nao configurado", "SUPABASE_NOT_CONFIGURED")
  }
}
