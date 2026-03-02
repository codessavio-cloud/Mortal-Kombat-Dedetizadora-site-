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
  const defaultPath = options.role === "admin" ? "/admin" : "/"

  const canAccessAdmin = options.role === "admin"
  const isAdminPath = (value: string) => value === "/admin" || value.startsWith("/admin/")

  if (requestedPath) {
    if (!canAccessAdmin && isAdminPath(requestedPath)) {
      return defaultPath
    }
    return requestedPath
  }

  if (apiRedirectTo) {
    if (!canAccessAdmin && isAdminPath(apiRedirectTo)) {
      return defaultPath
    }
    return apiRedirectTo
  }

  return defaultPath
}

export function toIsoFromUnixTimestamp(seconds: number | null | undefined) {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return null
  }

  return new Date(seconds * 1000).toISOString()
}
