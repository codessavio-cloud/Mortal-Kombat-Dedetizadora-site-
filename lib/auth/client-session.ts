"use client"

import type { UserRole } from "@/lib/auth/jwt"
import {
  type AuthSessionStatus,
  resolvePostLoginRedirect,
  sanitizeNextPath,
} from "@/lib/auth/session-utils"

const SESSION_CACHE_TTL_MS = 10_000
const AUTH_EVENT_STORAGE_KEY = "mk-auth-event"
const AUTH_EVENT_CHANNEL = "mk-auth-session"
const DEFAULT_AUTH_TIMEOUT_MS = 12000

interface AuthEventPayload {
  type: "login" | "logout" | "refresh"
  timestamp: number
  id: string
}

export interface ClientSessionUser {
  id: string
  username: string
  role: UserRole
}

export interface ClientSessionSnapshot {
  status: AuthSessionStatus
  user: ClientSessionUser | null
  expiresAt: string | null
  requestId?: string
}

interface SessionApiResponse {
  user?: ClientSessionUser
  expiresAt?: string | null
  sessionStatus?: AuthSessionStatus
  error?: string
  code?: string
}

interface LoginSuccessResponse {
  success: true
  user: ClientSessionUser
  redirectTo?: string
  expiresAt?: string | null
  sessionStatus?: AuthSessionStatus
}

interface LoginErrorResponse {
  error: string
  code?: string
  retryAfterSeconds?: number
  remainingAttempts?: number
  redirectTo?: string
}

export interface LoginClientResultSuccess {
  ok: true
  data: LoginSuccessResponse
  requestId?: string
}

export interface LoginClientResultFailure {
  ok: false
  status: number
  data: LoginErrorResponse
  requestId?: string
}

export type LoginClientResult = LoginClientResultSuccess | LoginClientResultFailure

type SessionListener = (snapshot: ClientSessionSnapshot) => void

let cachedSnapshot: ClientSessionSnapshot | null = null
let cachedAt = 0
let pendingSessionRequest: Promise<ClientSessionSnapshot> | null = null
const listeners = new Set<SessionListener>()
let broadcastChannel: BroadcastChannel | null = null

function now() {
  return Date.now()
}

function randomId() {
  return `${now()}-${Math.random().toString(36).slice(2, 10)}`
}

function getBroadcastChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null
  }

  if (!broadcastChannel) {
    broadcastChannel = new BroadcastChannel(AUTH_EVENT_CHANNEL)
  }

  return broadcastChannel
}

function notifyListeners(snapshot: ClientSessionSnapshot) {
  for (const listener of listeners) {
    listener(snapshot)
  }
}

function updateSessionCache(snapshot: ClientSessionSnapshot) {
  cachedSnapshot = snapshot
  cachedAt = now()
  notifyListeners(snapshot)
}

function createUnauthenticatedSnapshot(requestId?: string): ClientSessionSnapshot {
  return {
    status: "unauthenticated",
    user: null,
    expiresAt: null,
    requestId,
  }
}

function isSessionFresh() {
  return cachedSnapshot !== null && now() - cachedAt < SESSION_CACHE_TTL_MS
}

function toAbortErrorMessage() {
  return {
    error: "Tempo limite da requisicao excedido.",
    code: "REQUEST_TIMEOUT",
  } satisfies LoginErrorResponse
}

function logAuthClientWarning(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") {
    return
  }

  if (details) {
    console.warn(message, details)
    return
  }

  console.warn(message)
}

function isClientSessionUser(value: unknown): value is ClientSessionUser {
  if (!value || typeof value !== "object") {
    return false
  }

  const candidate = value as Partial<ClientSessionUser>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.username === "string" &&
    (candidate.role === "admin" || candidate.role === "funcionario")
  )
}

function parseLoginSuccessResponse(data: Record<string, unknown>): LoginSuccessResponse | null {
  if (data.success !== true || !isClientSessionUser(data.user)) {
    return null
  }

  const redirectTo = typeof data.redirectTo === "string" ? data.redirectTo : undefined
  const expiresAt = typeof data.expiresAt === "string" ? data.expiresAt : null
  const sessionStatus =
    data.sessionStatus === "authenticated" ||
    data.sessionStatus === "unauthenticated" ||
    data.sessionStatus === "refreshing" ||
    data.sessionStatus === "checking"
      ? data.sessionStatus
      : undefined

  return {
    success: true,
    user: data.user,
    redirectTo,
    expiresAt,
    sessionStatus,
  }
}

async function fetchJsonWithTimeout(path: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(path, {
      cache: "no-store",
      ...init,
      signal: controller.signal,
    })

    const requestId = response.headers.get("x-request-id") || undefined
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>

    return { response, data, requestId }
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchSessionSnapshotWithRetry(timeoutMs: number, retries: number) {
  const attempts = Math.max(1, retries + 1)

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const result = await fetchJsonWithTimeout(
        "/api/auth/me",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        },
        timeoutMs,
      )

      if (!result.response.ok && result.response.status >= 500 && attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        continue
      }

      return result
    } catch (error) {
      if (attempt < attempts - 1) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        continue
      }
      throw error
    }
  }

  return fetchJsonWithTimeout(
    "/api/auth/me",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    },
    timeoutMs,
  )
}

export function getCachedSessionSnapshot() {
  return cachedSnapshot
}

export function clearClientSessionCache() {
  cachedSnapshot = null
  cachedAt = 0
}

export function subscribeSessionSnapshots(listener: SessionListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function parseAuthEvent(raw: unknown): AuthEventPayload | null {
  if (!raw || typeof raw !== "object") {
    return null
  }

  const candidate = raw as Partial<AuthEventPayload>
  if (
    (candidate.type !== "login" && candidate.type !== "logout" && candidate.type !== "refresh") ||
    typeof candidate.timestamp !== "number" ||
    typeof candidate.id !== "string"
  ) {
    return null
  }

  return {
    type: candidate.type,
    timestamp: candidate.timestamp,
    id: candidate.id,
  }
}

export function publishAuthEvent(type: AuthEventPayload["type"]) {
  if (typeof window === "undefined") {
    return
  }

  const payload: AuthEventPayload = {
    type,
    timestamp: now(),
    id: randomId(),
  }

  try {
    localStorage.setItem(AUTH_EVENT_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // localStorage can fail in private modes.
  }

  getBroadcastChannel()?.postMessage(payload)
}

export function subscribeAuthEvents(handler: (event: AuthEventPayload) => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== AUTH_EVENT_STORAGE_KEY || !event.newValue) {
      return
    }

    try {
      const parsed = parseAuthEvent(JSON.parse(event.newValue))
      if (parsed) {
        handler(parsed)
      }
    } catch {
      // Ignore malformed payloads.
    }
  }

  const onBroadcast = (event: MessageEvent) => {
    const parsed = parseAuthEvent(event.data)
    if (parsed) {
      handler(parsed)
    }
  }

  window.addEventListener("storage", onStorage)
  const channel = getBroadcastChannel()
  channel?.addEventListener("message", onBroadcast)

  return () => {
    window.removeEventListener("storage", onStorage)
    channel?.removeEventListener("message", onBroadcast)
  }
}

export async function readClientSession(options?: {
  force?: boolean
  status?: AuthSessionStatus
  timeoutMs?: number
  retries?: number
}) {
  const force = options?.force ?? false

  if (!force && isSessionFresh() && cachedSnapshot) {
    return cachedSnapshot
  }

  if (pendingSessionRequest) {
    return pendingSessionRequest
  }

  const requestStatus = options?.status ?? "refreshing"
  if (cachedSnapshot) {
    updateSessionCache({
      ...cachedSnapshot,
      status: requestStatus,
    })
  }

  pendingSessionRequest = (async () => {
    try {
      const { response, data, requestId } = await fetchSessionSnapshotWithRetry(
        options?.timeoutMs ?? DEFAULT_AUTH_TIMEOUT_MS,
        options?.retries ?? 1,
      )

      if (!response.ok) {
        logAuthClientWarning("[auth] Session check failed", {
          requestId,
          status: response.status,
          code: typeof data.code === "string" ? data.code : undefined,
        })
        const snapshot = createUnauthenticatedSnapshot(requestId)
        updateSessionCache(snapshot)
        return snapshot
      }

      const parsed = data as SessionApiResponse
      const hasUser = Boolean(parsed.user)
      const snapshot: ClientSessionSnapshot = {
        status: hasUser ? "authenticated" : "unauthenticated",
        user: parsed.user || null,
        expiresAt: parsed.expiresAt ?? null,
        requestId,
      }

      updateSessionCache(snapshot)
      return snapshot
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        const snapshot = createUnauthenticatedSnapshot()
        updateSessionCache(snapshot)
        return snapshot
      }

      const snapshot = createUnauthenticatedSnapshot()
      updateSessionCache(snapshot)
      return snapshot
    } finally {
      pendingSessionRequest = null
    }
  })()

  return pendingSessionRequest
}

export async function loginClientSession(payload: {
  username: string
  password: string
  location?: { latitude: number; longitude: number } | null
  timeoutMs?: number
  retries?: number
}): Promise<LoginClientResult> {
  const attempts = Math.max(1, (payload.retries ?? 1) + 1)
  const timeoutMs = payload.timeoutMs ?? DEFAULT_AUTH_TIMEOUT_MS

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      const { response, data, requestId } = await fetchJsonWithTimeout(
        "/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            username: payload.username,
            password: payload.password,
            location: payload.location ?? null,
          }),
        },
        timeoutMs,
      )

      if (response.ok) {
        const parsed = parseLoginSuccessResponse(data)
        if (!parsed) {
          return {
            ok: false,
            status: 500,
            data: {
              error: "Resposta invalida do servidor.",
              code: "INVALID_RESPONSE",
            },
            requestId,
          }
        }

        const snapshot: ClientSessionSnapshot = {
          status: "authenticated",
          user: parsed.user,
          expiresAt: parsed.expiresAt ?? null,
          requestId,
        }
        updateSessionCache(snapshot)
        publishAuthEvent("login")

        return {
          ok: true,
          data: parsed,
          requestId,
        }
      }

      const parsedError = data as Partial<LoginErrorResponse>
      logAuthClientWarning("[auth] Login failed", {
        requestId,
        status: response.status,
        code: typeof parsedError.code === "string" ? parsedError.code : undefined,
      })
      const failure: LoginClientResultFailure = {
        ok: false,
        status: response.status,
        data: {
          error: typeof parsedError.error === "string" ? parsedError.error : `Erro na requisicao (${response.status})`,
          code: typeof parsedError.code === "string" ? parsedError.code : undefined,
          retryAfterSeconds:
            typeof parsedError.retryAfterSeconds === "number" ? parsedError.retryAfterSeconds : undefined,
          remainingAttempts:
            typeof parsedError.remainingAttempts === "number" ? parsedError.remainingAttempts : undefined,
          redirectTo: typeof parsedError.redirectTo === "string" ? parsedError.redirectTo : undefined,
        },
        requestId,
      }

      return failure
    } catch (error) {
      const isAbort = error instanceof DOMException && error.name === "AbortError"
      const isLastAttempt = attempt === attempts - 1

      if (!isLastAttempt) {
        await new Promise((resolve) => setTimeout(resolve, 250))
        continue
      }

      return {
        ok: false,
        status: isAbort ? 408 : 500,
        data: isAbort
          ? toAbortErrorMessage()
          : {
              error: "Falha de comunicacao com o servidor.",
              code: "REQUEST_FAILED",
            },
      }
    }
  }

  return {
    ok: false,
    status: 500,
    data: {
      error: "Falha de comunicacao com o servidor.",
      code: "REQUEST_FAILED",
    },
  }
}

export async function logoutClientSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
    })
  } finally {
    updateSessionCache(createUnauthenticatedSnapshot())
    publishAuthEvent("logout")
  }
}

export {
  resolvePostLoginRedirect,
  sanitizeNextPath,
}
