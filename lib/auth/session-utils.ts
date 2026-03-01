import type { UserRole } from "@/lib/auth/jwt"

export type AuthSessionStatus = "checking" | "authenticated" | "unauthenticated" | "refreshing"

export function sanitizeNextPath(nextPath: string | null | undefined) {
  if (!nextPath) {
    return null
  }

  if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return null
  }

  if (nextPath.startsWith("/api/") || nextPath === "/login") {
    return null
  }

  return nextPath
}

export function resolvePostLoginRedirect(options: {
  role: UserRole
  requestedPath?: string | null
  apiRedirectTo?: string | null
}) {
  const requestedPath = sanitizeNextPath(options.requestedPath)
  const apiRedirectTo = sanitizeNextPath(options.apiRedirectTo)

  if (requestedPath) {
    return requestedPath
  }

  if (apiRedirectTo) {
    return apiRedirectTo
  }

  return options.role === "admin" ? "/admin" : "/"
}

export function toIsoFromUnixTimestamp(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null
  }

  return new Date(seconds * 1000).toISOString()
}
