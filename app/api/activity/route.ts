import { NextResponse } from "next/server"

import { parseBooleanQueryParam, parseIntegerQueryParam, parseStringQueryParam } from "@/lib/api/query"
import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"
import { appLogger } from "@/lib/observability/logger"
import { parseJsonBodyWithLimit } from "@/lib/security/body"
import { enforceSameOrigin } from "@/lib/security/request"
import { normalizeCoordinate, normalizeOptionalText, sanitizePlainText } from "@/lib/security/validation"
import { createClient } from "@/lib/supabase/server"

const EMPTY_STATS = {
  totalLogs: 0,
  todayLogs: 0,
  loginCount: 0,
  calculoCount: 0,
  copiaCount: 0,
  navegacaoCount: 0,
}

const DEFAULT_ACTIVITY_LIMIT = 100
const MAX_ACTIVITY_LIMIT = 100
const CURSOR_QUERY_BUFFER = 25
const MAX_ACTIVITY_PAYLOAD_BYTES = 32 * 1024

type ActivityType = "todos" | "login" | "calculo" | "copia" | "navegacao" | "usuario" | "limpeza"

type CursorPayload = {
  createdAt: string
  id: string
}

type ActivityLogRow = {
  id: string
  user_id: string
  username: string
  action: string
  details: string | null
  page: string | null
  created_at: string
  latitude: number | null
  longitude: number | null
}

type CountQueryResult = {
  count: number | null
  error: unknown
}

function parseActivityType(value: string | null) {
  if (!value || value === "todos") {
    return { value: "todos" as ActivityType, error: null }
  }

  const normalized = value.trim().toLowerCase()
  const validTypes: ActivityType[] = ["todos", "login", "calculo", "copia", "navegacao", "usuario", "limpeza"]

  if (!validTypes.includes(normalized as ActivityType)) {
    return {
      value: "todos" as ActivityType,
      error: {
        error: "type invalido",
        code: "INVALID_QUERY_PARAM",
        details: { param: "type", allowed: validTypes },
      },
    }
  }

  return { value: normalized as ActivityType, error: null }
}

function encodeCursor(cursor: CursorPayload) {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url")
}

function parseCursor(value: string | null) {
  if (!value) {
    return { value: null, error: null as { error: string; code: string; details?: unknown } | null }
  }

  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8")
    const parsed = JSON.parse(decoded) as Partial<CursorPayload>

    if (
      typeof parsed.createdAt !== "string" ||
      parsed.createdAt.length === 0 ||
      Number.isNaN(Date.parse(parsed.createdAt)) ||
      typeof parsed.id !== "string" ||
      parsed.id.length === 0
    ) {
      return {
        value: null,
        error: {
          error: "cursor invalido",
          code: "INVALID_QUERY_PARAM",
          details: { param: "cursor" },
        },
      }
    }

    return {
      value: {
        createdAt: parsed.createdAt,
        id: parsed.id,
      } satisfies CursorPayload,
      error: null,
    }
  } catch {
    return {
      value: null,
      error: {
        error: "cursor invalido",
        code: "INVALID_QUERY_PARAM",
        details: { param: "cursor" },
      },
    }
  }
}

function toSearchPattern(search: string) {
  const safeSearch = search.replace(/[%_(),]/g, " ").replace(/\s+/g, " ").trim()
  return `%${safeSearch}%`
}

function applyBaseFilters(query: any, username: string | null, search: string | null) {
  let nextQuery = query

  if (username && username !== "todos") {
    nextQuery = nextQuery.eq("username", username)
  }

  if (search) {
    const pattern = toSearchPattern(search)
    nextQuery = nextQuery.or(`action.ilike.${pattern},details.ilike.${pattern},page.ilike.${pattern}`)
  }

  return nextQuery
}

function applyTypeFilter(query: any, activityType: ActivityType) {
  switch (activityType) {
    case "login":
      return query.eq("action", "Login")
    case "calculo":
      return query.ilike("action", "Calculou%")
    case "copia":
      return query.ilike("action", "Copiou%")
    case "navegacao":
      return query.or("action.ilike.Acessou%,action.ilike.Navegou%")
    case "limpeza":
      return query.ilike("action", "Limpou%")
    case "usuario":
      return query
        .not("action", "eq", "Login")
        .not("action", "ilike", "Calculou%")
        .not("action", "ilike", "Copiou%")
        .not("action", "ilike", "Acessou%")
        .not("action", "ilike", "Navegou%")
        .not("action", "ilike", "Limpou%")
    case "todos":
    default:
      return query
  }
}

function applyFilters(query: any, filters: { username: string | null; search: string | null; type: ActivityType }) {
  return applyTypeFilter(applyBaseFilters(query, filters.username, filters.search), filters.type)
}

async function readCount(queryPromise: PromiseLike<CountQueryResult>, label: string, requestId?: string) {
  try {
    const { count, error } = await queryPromise
    if (error) {
      appLogger.warn("Falha ao calcular contagem de atividades", {
        route: "/api/activity",
        requestId,
        label,
        error,
      })
      return 0
    }

    return count ?? 0
  } catch (error) {
    appLogger.warn("Excecao ao calcular contagem de atividades", {
      route: "/api/activity",
      requestId,
      label,
      error,
    })
    return 0
  }
}

export async function GET(request: Request) {
  const requestId = request.headers.get("x-request-id") || undefined

  if (!isJwtSecretConfigured()) {
    return apiError(503, "JWT_SECRET nao configurado no ambiente.", AUTH_ERROR_CODES.jwtNotConfigured)
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError(401, "Nao autorizado", AUTH_ERROR_CODES.notAuthenticated)
  }

  if (user.role !== "admin") {
    return apiError(403, "Acesso negado", AUTH_ERROR_CODES.forbidden)
  }

  const { searchParams } = new URL(request.url)

  const limitResult = parseIntegerQueryParam(searchParams.get("limit"), {
    name: "limit",
    defaultValue: DEFAULT_ACTIVITY_LIMIT,
    min: 1,
    max: MAX_ACTIVITY_LIMIT,
  })
  if (limitResult.error) {
    return apiError(400, limitResult.error.error, limitResult.error.code, limitResult.error.details)
  }

  const includeStatsResult = parseBooleanQueryParam(searchParams.get("includeStats"), {
    name: "includeStats",
    defaultValue: true,
  })
  if (includeStatsResult.error) {
    return apiError(
      400,
      includeStatsResult.error.error,
      includeStatsResult.error.code,
      includeStatsResult.error.details,
    )
  }

  const usernameResult = parseStringQueryParam(searchParams.get("username"), {
    name: "username",
    maxLength: 64,
  })
  if (usernameResult.error) {
    return apiError(400, usernameResult.error.error, usernameResult.error.code, usernameResult.error.details)
  }

  const typeResult = parseActivityType(searchParams.get("type"))
  if (typeResult.error) {
    return apiError(400, typeResult.error.error, typeResult.error.code, typeResult.error.details)
  }

  const searchResult = parseStringQueryParam(searchParams.get("search"), {
    name: "search",
    maxLength: 120,
  })
  if (searchResult.error) {
    return apiError(400, searchResult.error.error, searchResult.error.code, searchResult.error.details)
  }

  const cursorStringResult = parseStringQueryParam(searchParams.get("cursor"), {
    name: "cursor",
    maxLength: 500,
  })
  if (cursorStringResult.error) {
    return apiError(
      400,
      cursorStringResult.error.error,
      cursorStringResult.error.code,
      cursorStringResult.error.details,
    )
  }

  const cursorResult = parseCursor(cursorStringResult.value)
  if (cursorResult.error) {
    return apiError(400, cursorResult.error.error, cursorResult.error.code, cursorResult.error.details)
  }

  const limit = limitResult.value
  const includeStats = includeStatsResult.value
  const username = normalizeOptionalText(usernameResult.value, 64)
  const activityType = typeResult.value
  const search = normalizeOptionalText(searchResult.value, 120)
  const cursor = cursorResult.value

  let supabase
  try {
    supabase = await createClient()
  } catch (error) {
    appLogger.warn("Cliente Supabase indisponivel para leitura de atividades", {
      route: "/api/activity",
      requestId,
      error,
    })
    return NextResponse.json({ logs: [], nextCursor: null, stats: includeStats ? EMPTY_STATS : null })
  }

  let logsQuery = supabase
    .from("activity_logs")
    .select("id, user_id, username, action, details, page, created_at, latitude, longitude")
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(limit + CURSOR_QUERY_BUFFER)

  logsQuery = applyFilters(logsQuery, {
    username,
    search,
    type: activityType,
  })

  if (cursor) {
    logsQuery = logsQuery.lte("created_at", cursor.createdAt)
  }

  const { data, error } = await logsQuery
  if (error) {
    appLogger.warn("Falha ao consultar logs de atividades", {
      route: "/api/activity",
      requestId,
      username,
      activityType,
      limit,
      error,
    })
    return NextResponse.json({ logs: [], nextCursor: null, stats: includeStats ? EMPTY_STATS : null })
  }

  let filteredRows = (data || []) as ActivityLogRow[]
  if (cursor) {
    filteredRows = filteredRows.filter(
      (log) => log.created_at < cursor.createdAt || (log.created_at === cursor.createdAt && log.id < cursor.id),
    )
  }

  const logs = filteredRows.slice(0, limit)
  const nextCursor =
    filteredRows.length > limit && logs.length > 0
      ? encodeCursor({ createdAt: logs[logs.length - 1].created_at, id: logs[logs.length - 1].id })
      : null

  if (!includeStats) {
    return NextResponse.json({ logs, nextCursor, stats: null })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayIso = today.toISOString()

  const buildCountQuery = () => {
    let countQuery = supabase.from("activity_logs").select("*", { count: "exact", head: true })
    if (username && username !== "todos") {
      countQuery = countQuery.eq("username", username)
    }
    return countQuery
  }

  const [totalLogs, todayLogs, loginCount, calculoCount, copiaCount, navegacaoCount] = await Promise.all([
    readCount(buildCountQuery(), "totalLogs", requestId),
    readCount(buildCountQuery().gte("created_at", todayIso), "todayLogs", requestId),
    readCount(buildCountQuery().eq("action", "Login"), "loginCount", requestId),
    readCount(buildCountQuery().ilike("action", "Calculou%"), "calculoCount", requestId),
    readCount(buildCountQuery().ilike("action", "Copiou%"), "copiaCount", requestId),
    readCount(
      buildCountQuery().or("action.ilike.Acessou%,action.ilike.Navegou%"),
      "navegacaoCount",
      requestId,
    ),
  ])

  const stats = {
    totalLogs,
    todayLogs,
    loginCount,
    calculoCount,
    copiaCount,
    navegacaoCount,
  }

  return NextResponse.json({ logs, nextCursor, stats })
}

export async function POST(request: Request) {
  const sameOriginError = enforceSameOrigin(request, "/api/activity")
  if (sameOriginError) {
    return sameOriginError
  }

  const requestId = request.headers.get("x-request-id") || undefined

  if (!isJwtSecretConfigured()) {
    return apiError(503, "JWT_SECRET nao configurado no ambiente.", AUTH_ERROR_CODES.jwtNotConfigured)
  }

  const user = await getAuthenticatedUser()
  if (!user) {
    return apiError(401, "Nao autorizado", AUTH_ERROR_CODES.notAuthenticated)
  }

  const { data: body, error: parseError } = await parseJsonBodyWithLimit<{
    action?: string
    details?: string
    page?: string
    latitude?: number
    longitude?: number
  }>(request, MAX_ACTIVITY_PAYLOAD_BYTES, "/api/activity")
  if (parseError) {
    return parseError
  }

  const action = sanitizePlainText(body?.action ?? "", 120)
  const details = normalizeOptionalText(body?.details, 500)
  const page = normalizeOptionalText(body?.page, 120)
  const latitude = normalizeCoordinate(body?.latitude, -90, 90)
  const longitude = normalizeCoordinate(body?.longitude, -180, 180)

  if (!action) {
    return apiError(400, "Acao e obrigatoria", "MISSING_ACTION")
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.from("activity_logs").insert({
      user_id: user.userId,
      username: user.username,
      action,
      details,
      page,
      latitude,
      longitude,
    })

    if (error) {
      appLogger.warn("Falha ao registrar atividade", {
        route: "/api/activity",
        requestId,
        userId: user.userId,
        action,
        error,
      })
    }
  } catch (error) {
    appLogger.warn("Excecao ao registrar atividade", {
      route: "/api/activity",
      requestId,
      userId: user.userId,
      action,
      error,
    })
  }

  return NextResponse.json({ success: true })
}
