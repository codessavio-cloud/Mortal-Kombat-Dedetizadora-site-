"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import {
  ADMIN_ACTIVITY_OVERVIEW_LIMIT,
  ADMIN_ACTIVITY_PAGE_SIZE,
  ADMIN_AUTO_REFRESH_INTERVAL_MS,
  ADMIN_SEARCH_DEBOUNCE_MS,
} from "@/lib/admin/constants"
import { resolveActivityType } from "@/lib/admin/formatters"
import type {
  AdminActivityFilterType,
  AdminActivityLog,
  AdminActivityResponse,
  AdminMonitoringCardData,
  AdminMonitoringStatusFilter,
  AdminMonitoringSummary,
  AdminStats,
  AdminTabType,
  AdminUser,
  MonitoringStatus,
} from "@/lib/admin/types"
import { adminApi, getErrorMessage, isReauthError } from "@/lib/api/admin-client"
import { logoutClientSession } from "@/lib/auth/client-session"

interface UseAdminActivityOptions {
  enabled: boolean
  activeTab: AdminTabType
  users: AdminUser[]
  onError: (message: string) => void
  onSuccess: (message: string) => void
}

function useDebouncedValue(value: string, waitMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), waitMs)
    return () => clearTimeout(timeout)
  }, [value, waitMs])

  return debouncedValue
}

const EMPTY_STATS: AdminStats = {
  totalLogs: 0,
  todayLogs: 0,
  loginCount: 0,
  calculoCount: 0,
  copiaCount: 0,
  navegacaoCount: 0,
}

export function useAdminActivity({ enabled, activeTab, users, onError, onSuccess }: UseAdminActivityOptions) {
  const [overviewLogs, setOverviewLogs] = useState<AdminActivityLog[]>([])
  const [activityLogs, setActivityLogs] = useState<AdminActivityLog[]>([])
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS)
  const [loadingOverview, setLoadingOverview] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [refreshingOverview, setRefreshingOverview] = useState(false)
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true)
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)

  const [filterUser, setFilterUser] = useState<string>("todos")
  const [filterActivityType, setFilterActivityType] =
    useState<AdminActivityFilterType>("todos")
  const [activitySearchTerm, setActivitySearchTerm] = useState("")

  const [monitorSearchTerm, setMonitorSearchTerm] = useState("")
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<AdminMonitoringStatusFilter>("todos")
  const [selectedUserDetails, setSelectedUserDetails] = useState<string | null>(null)

  const [currentCursor, setCurrentCursor] = useState<string | null>(null)
  const [previousCursors, setPreviousCursors] = useState<Array<string | null>>([])
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [currentLogsPage, setCurrentLogsPage] = useState(1)

  const debouncedActivitySearch = useDebouncedValue(activitySearchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS)

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

  const loadOverview = useCallback(
    async (options?: { includeStats?: boolean; silent?: boolean }) => {
      if (!enabled) {
        return
      }

      const includeStats = options?.includeStats ?? true
      const silent = options?.silent ?? false
      setLoadingOverview(true)
      try {
        const query = new URLSearchParams({
          limit: String(ADMIN_ACTIVITY_OVERVIEW_LIMIT),
          includeStats: includeStats ? "true" : "false",
        })

        const response = await adminApi.get<AdminActivityResponse>("/api/activity", { query })
        setOverviewLogs(response.logs || [])
        if (response.stats) {
          setStats(response.stats)
        }
        setLastRefreshAt(new Date().toISOString())
      } catch (error) {
        await handleError(error, "Nao foi possivel carregar atividades.", silent)
      } finally {
        setLoadingOverview(false)
      }
    },
    [enabled, handleError],
  )

  const loadActivityPage = useCallback(
    async (options?: { cursor?: string | null; includeStats?: boolean; silent?: boolean }) => {
      if (!enabled) {
        return
      }

      const cursor = options?.cursor ?? currentCursor
      const includeStats = options?.includeStats ?? false
      const silent = options?.silent ?? false
      setLoadingActivities(true)

      try {
        const query = new URLSearchParams({
          limit: String(ADMIN_ACTIVITY_PAGE_SIZE),
          includeStats: includeStats ? "true" : "false",
        })

        if (cursor) {
          query.set("cursor", cursor)
        }
        if (filterUser !== "todos") {
          query.set("username", filterUser)
        }
        if (filterActivityType !== "todos") {
          query.set("type", filterActivityType)
        }
        if (debouncedActivitySearch) {
          query.set("search", debouncedActivitySearch)
        }

        const response = await adminApi.get<AdminActivityResponse>("/api/activity", { query })
        setActivityLogs(response.logs || [])
        setNextCursor(response.nextCursor || null)
        if (response.stats) {
          setStats(response.stats)
        }
        setLastRefreshAt(new Date().toISOString())
      } catch (error) {
        await handleError(error, "Nao foi possivel carregar logs.", silent)
      } finally {
        setLoadingActivities(false)
      }
    },
    [
      currentCursor,
      debouncedActivitySearch,
      enabled,
      filterActivityType,
      filterUser,
      handleError,
    ],
  )

  useEffect(() => {
    if (!enabled) {
      return
    }

    void loadOverview({ includeStats: true, silent: true })
  }, [enabled, loadOverview])

  useEffect(() => {
    if (!enabled) {
      return
    }

    setCurrentCursor(null)
    setPreviousCursors([])
    setCurrentLogsPage(1)
    setNextCursor(null)
    void loadActivityPage({ cursor: null, includeStats: false, silent: true })
  }, [debouncedActivitySearch, enabled, filterActivityType, filterUser, loadActivityPage])

  useEffect(() => {
    if (!enabled) {
      return
    }

    let interval: ReturnType<typeof setInterval> | null = null

    interval = setInterval(() => {
      if (!autoRefreshLogs) {
        return
      }
      if (typeof document !== "undefined" && document.hidden) {
        return
      }

      if (activeTab === "atividades") {
        void loadActivityPage({ includeStats: false, silent: true })
      }

      if (activeTab === "dashboard" || activeTab === "monitoramento") {
        void loadOverview({ includeStats: false, silent: true })
      }
    }, ADMIN_AUTO_REFRESH_INTERVAL_MS)

    const onVisibilityChange = () => {
      if (!autoRefreshLogs) {
        return
      }
      if (typeof document !== "undefined" && document.hidden) {
        return
      }

      if (activeTab === "atividades") {
        void loadActivityPage({ includeStats: false, silent: true })
      }

      if (activeTab === "dashboard" || activeTab === "monitoramento") {
        void loadOverview({ includeStats: false, silent: true })
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVisibilityChange)
    }

    return () => {
      if (interval) {
        clearInterval(interval)
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", onVisibilityChange)
      }
    }
  }, [activeTab, autoRefreshLogs, enabled, loadActivityPage, loadOverview])

  const refreshOverview = useCallback(async () => {
    setRefreshingOverview(true)
    try {
      await Promise.all([
        loadOverview({ includeStats: true, silent: true }),
        loadActivityPage({ includeStats: false, silent: true }),
      ])
      onSuccess("Painel atualizado.")
    } catch {
      onError("Nao foi possivel atualizar o painel.")
    } finally {
      setRefreshingOverview(false)
    }
  }, [loadActivityPage, loadOverview, onError, onSuccess])

  const refreshActivities = useCallback(async () => {
    await loadActivityPage({ includeStats: true })
  }, [loadActivityPage])

  const goToNextLogsPage = useCallback(async () => {
    if (!nextCursor || loadingActivities) {
      return
    }

    setPreviousCursors((previous) => [...previous, currentCursor])
    setCurrentCursor(nextCursor)
    setCurrentLogsPage((page) => page + 1)
    await loadActivityPage({ cursor: nextCursor, includeStats: false })
  }, [currentCursor, loadActivityPage, loadingActivities, nextCursor])

  const goToPreviousLogsPage = useCallback(async () => {
    if (previousCursors.length === 0 || loadingActivities) {
      return
    }

    const previousCursor = previousCursors[previousCursors.length - 1]
    setPreviousCursors((previous) => previous.slice(0, -1))
    setCurrentCursor(previousCursor)
    setCurrentLogsPage((page) => Math.max(1, page - 1))
    await loadActivityPage({ cursor: previousCursor, includeStats: false })
  }, [loadActivityPage, loadingActivities, previousCursors])

  const exportCurrentActivities = useCallback(() => {
    if (activityLogs.length === 0) {
      onError("Nao ha logs para exportar com os filtros atuais.")
      return
    }

    const escapeCsv = (value: string | number | null | undefined) => {
      const safeValue = value ?? ""
      return `"${String(safeValue).replace(/"/g, '""')}"`
    }

    const csvHeader = ["Usuario", "Acao", "Detalhes", "Pagina", "Data", "Latitude", "Longitude"]
    const csvRows = activityLogs.map((log) => [
      escapeCsv(log.username),
      escapeCsv(log.action),
      escapeCsv(log.details),
      escapeCsv(log.page),
      escapeCsv(log.created_at),
      escapeCsv(log.latitude),
      escapeCsv(log.longitude),
    ])

    const csvContent = [csvHeader.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")

    link.href = url
    link.download = `logs-admin-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()

    URL.revokeObjectURL(url)
    onSuccess("Exportacao de logs concluida.")
  }, [activityLogs, onError, onSuccess])

  const monitoringCards = useMemo<AdminMonitoringCardData[]>(() => {
    const logsByUsername = new Map<string, AdminActivityLog[]>()
    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    for (const log of overviewLogs) {
      const list = logsByUsername.get(log.username)
      if (list) {
        list.push(log)
      } else {
        logsByUsername.set(log.username, [log])
      }
    }

    return users
      .filter((user) => user.role === "funcionario")
      .map((user) => {
        const userLogs = [...(logsByUsername.get(user.username) || [])].sort(
          (left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime(),
        )

        const lastActivity = userLogs[0]
        const lastActivityAt = lastActivity ? new Date(lastActivity.created_at).getTime() : 0
        const inactivityMs = lastActivityAt > 0 ? now - lastActivityAt : Number.POSITIVE_INFINITY

        let status: MonitoringStatus = "inativo"
        if (inactivityMs <= 30 * 60 * 1000) {
          status = "ativo"
        } else if (inactivityMs <= 24 * 60 * 60 * 1000) {
          status = "atencao"
        }

        return {
          user,
          userLogs,
          lastActivity,
          lastLogin: userLogs.find((log) => log.action === "Login"),
          calculos: userLogs.filter((log) => resolveActivityType(log.action) === "calculo").length,
          copias: userLogs.filter((log) => resolveActivityType(log.action) === "copia").length,
          navegacoes: userLogs.filter((log) => resolveActivityType(log.action) === "navegacao").length,
          acoesHoje: userLogs.filter((log) => new Date(log.created_at).getTime() >= todayStartMs).length,
          totalAcoes: userLogs.length,
          paginasUnicas: new Set(userLogs.map((log) => log.page).filter(Boolean)).size,
          status,
          lastLocation: userLogs.find((log) => log.latitude !== null && log.longitude !== null),
        }
      })
      .sort((left, right) => {
        const leftTs = left.lastActivity ? new Date(left.lastActivity.created_at).getTime() : 0
        const rightTs = right.lastActivity ? new Date(right.lastActivity.created_at).getTime() : 0
        return rightTs - leftTs
      })
  }, [overviewLogs, users])

  const monitoringSummary = useMemo<AdminMonitoringSummary>(() => {
    const active = monitoringCards.filter((card) => card.status === "ativo").length
    const attention = monitoringCards.filter((card) => card.status === "atencao").length
    const inactive = monitoringCards.filter((card) => card.status === "inativo").length
    const withoutLogin = monitoringCards.filter((card) => !card.lastLogin).length

    return {
      total: monitoringCards.length,
      active,
      attention,
      inactive,
      withoutLogin,
    }
  }, [monitoringCards])

  const filteredMonitoringCards = useMemo(
    () =>
      monitoringCards.filter((card) => {
        const normalizedSearch = monitorSearchTerm.trim().toLowerCase()
        const matchesSearch =
          normalizedSearch.length === 0 || card.user.username.toLowerCase().includes(normalizedSearch)
        const matchesStatus = monitorStatusFilter === "todos" || card.status === monitorStatusFilter
        return matchesSearch && matchesStatus
      }),
    [monitorSearchTerm, monitorStatusFilter, monitoringCards],
  )

  return {
    overviewLogs,
    activityLogs,
    stats,
    loadingOverview,
    loadingActivities,
    refreshingOverview,
    autoRefreshLogs,
    lastRefreshAt,
    filterUser,
    filterActivityType,
    activitySearchTerm,
    monitorSearchTerm,
    monitorStatusFilter,
    selectedUserDetails,
    currentLogsPage,
    hasPreviousLogsPage: previousCursors.length > 0,
    hasNextLogsPage: Boolean(nextCursor),
    monitoringCards,
    monitoringSummary,
    filteredMonitoringCards,
    setAutoRefreshLogs,
    setFilterUser,
    setFilterActivityType,
    setActivitySearchTerm,
    setMonitorSearchTerm,
    setMonitorStatusFilter,
    setSelectedUserDetails,
    loadOverview,
    loadActivityPage,
    refreshOverview,
    refreshActivities,
    goToNextLogsPage,
    goToPreviousLogsPage,
    exportCurrentActivities,
  }
}
