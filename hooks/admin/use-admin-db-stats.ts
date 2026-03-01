"use client"

import { useCallback, useEffect, useState } from "react"

import type { AdminDbStats, AdminTabType } from "@/lib/admin/types"
import { adminApi, getErrorMessage, isReauthError } from "@/lib/api/admin-client"
import { logoutClientSession, readClientSession } from "@/lib/auth/client-session"

interface UseAdminDbStatsOptions {
  enabled: boolean
  activeTab: AdminTabType
  onSuccess: (message: string) => void
  onError: (message: string) => void
  onAfterClear?: () => Promise<void> | void
}

export function useAdminDbStats({
  enabled,
  activeTab,
  onError,
  onSuccess,
  onAfterClear,
}: UseAdminDbStatsOptions) {
  const [dbStats, setDbStats] = useState<AdminDbStats | null>(null)
  const [loadingDb, setLoadingDb] = useState(false)
  const [clearingData, setClearingData] = useState(false)

  const handleError = useCallback(
    async (error: unknown, fallback: string, silent = false) => {
      if (isReauthError(error)) {
        if (!silent) {
          onError("Sessao expirada. Faca login novamente.")
        }
        await logoutClientSession()
        return
      }

      if (!silent) {
        onError(getErrorMessage(error, fallback))
      }
    },
    [onError],
  )

  const ensureAdminSession = useCallback(
    async (silent = false) => {
      const session = await readClientSession({ force: false, status: "checking" })
      if (!session.user || session.status !== "authenticated") {
        if (!silent) {
          onError("Sessao expirada. Faca login novamente.")
        }
        await logoutClientSession()
        return false
      }

      if (session.user.role !== "admin") {
        if (!silent) {
          onError("Acesso restrito ao administrador.")
        }
        await logoutClientSession()
        return false
      }

      return true
    },
    [onError],
  )

  const loadDbStats = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!enabled) {
        return
      }

      const silent = options?.silent ?? false
      const sessionOk = await ensureAdminSession(silent)
      if (!sessionOk) {
        return
      }

      setLoadingDb(true)
      try {
        const response = await adminApi.get<AdminDbStats>("/api/db/stats")
        setDbStats(response)
      } catch (error) {
        await handleError(error, "Nao foi possivel carregar estatisticas do banco.", silent)
      } finally {
        setLoadingDb(false)
      }
    },
    [enabled, ensureAdminSession, handleError],
  )

  useEffect(() => {
    if (!enabled || activeTab !== "banco" || dbStats) {
      return
    }

    void loadDbStats({ silent: true })
  }, [activeTab, dbStats, enabled, loadDbStats])

  const clearData = useCallback(
    async (table: "activity_logs" | "orcamentos", olderThanDays?: number) => {
      const confirmMsg = olderThanDays
        ? `Tem certeza que deseja apagar logs mais antigos que ${olderThanDays} dias?`
        : `Tem certeza que deseja limpar todos os dados de ${table}? Esta acao nao pode ser desfeita.`

      if (!confirm(confirmMsg)) {
        return
      }

      const sessionOk = await ensureAdminSession(false)
      if (!sessionOk) {
        return
      }

      setClearingData(true)
      try {
        const response = await adminApi.post<{ message?: string }>("/api/db/clear", {
          table,
          olderThanDays,
        })

        onSuccess(response.message || "Dados limpos com sucesso.")
        await loadDbStats({ silent: true })
        if (onAfterClear) {
          await onAfterClear()
        }
      } catch (error) {
        await handleError(error, "Nao foi possivel limpar os dados.")
      } finally {
        setClearingData(false)
      }
    },
    [ensureAdminSession, handleError, loadDbStats, onAfterClear, onSuccess],
  )

  return {
    dbStats,
    loadingDb,
    clearingData,
    loadDbStats,
    clearData,
  }
}
