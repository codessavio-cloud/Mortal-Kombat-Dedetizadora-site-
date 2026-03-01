"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

import { adminApi, getErrorMessage, isReauthError } from "@/lib/api/admin-client"
import {
  logoutClientSession,
  readClientSession,
  subscribeAuthEvents,
} from "@/lib/auth/client-session"
import type { AdminCurrentUser } from "@/lib/admin/types"

interface UseAdminSessionOptions {
  onError: (message: string) => void
}

export function useAdminSession({ onError }: UseAdminSessionOptions) {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<AdminCurrentUser | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)
  const [loggingOut, setLoggingOut] = useState(false)

  const ensureAdminSession = useCallback(async () => {
    setLoadingSession(true)

    try {
      const cachedSession = await readClientSession({ force: false, status: "checking" })
      if (cachedSession.status === "unauthenticated" || !cachedSession.user) {
        router.replace("/login")
        return null
      }

      const response = await adminApi.get<{ user: AdminCurrentUser | null; sessionStatus?: string }>("/api/auth/me")
      if (!response.user || response.sessionStatus === "unauthenticated") {
        router.replace("/login")
        return null
      }

      if (response.user.role !== "admin") {
        router.replace("/")
        return null
      }

      setCurrentUser(response.user)
      return response.user
    } catch (error) {
      if (isReauthError(error)) {
        onError("Sessao expirada. Faca login novamente.")
      } else {
        onError(getErrorMessage(error, "Nao foi possivel validar a sessao."))
      }
      router.replace("/login")
      return null
    } finally {
      setLoadingSession(false)
    }
  }, [onError, router])

  const logout = useCallback(async () => {
    if (loggingOut) {
      return
    }

    setLoggingOut(true)
    try {
      await logoutClientSession()
    } catch (error) {
      onError(getErrorMessage(error, "Falha ao encerrar sessao."))
    } finally {
      router.replace("/login")
      router.refresh()
      setLoggingOut(false)
    }
  }, [loggingOut, onError, router])

  useEffect(() => {
    const unsubscribe = subscribeAuthEvents((event) => {
      if (event.type !== "logout") {
        return
      }

      setCurrentUser(null)
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        router.replace("/login")
        router.refresh()
      }
    })

    return () => {
      unsubscribe()
    }
  }, [router])

  return {
    currentUser,
    loadingSession,
    loggingOut,
    ensureAdminSession,
    logout,
  }
}
