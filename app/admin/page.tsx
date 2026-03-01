"use client"

import type React from "react"
import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface User {
  id: string
  username: string
  role: string
  created_at: string
  ultimo_login?: string
  ativo?: boolean
}

interface ActivityLog {
  id: string
  user_id: string
  username: string
  action: string
  details: string
  page: string
  created_at: string
  latitude?: number
  longitude?: number
}

interface Stats {
  totalLogs: number
  todayLogs: number
  loginCount: number
  calculoCount: number
  copiaCount: number
  navegacaoCount: number
}

interface DbStats {
  tables: {
    users: number
    activity_logs: number
    orcamentos: number
  }
  totalRecords: number
  estimatedSizeKB: number
  estimatedSizeMB: number
  logsLast7Days: number
  logsToday: number
  maxFreeRecords: number
  usagePercent: number
}

interface CurrentUser {
  id: string
  username: string
  role: "admin" | "funcionario"
}

interface MonitoringCardData {
  user: User
  userLogs: ActivityLog[]
  lastLogin: ActivityLog | undefined
  lastActivity: ActivityLog | undefined
  calculos: number
  copias: number
  navegacoes: number
  acoesHoje: number
  totalAcoes: number
  paginasUnicas: number
  status: MonitoringStatus
  lastLocation: ActivityLog | undefined
}

type MonitoringStatus = "ativo" | "atencao" | "inativo"
type MonitoringStatusFilter = "todos" | MonitoringStatus

type TabType = "dashboard" | "funcionarios" | "atividades" | "monitoramento" | "banco" | "perfil"
type ActivityFilterType =
  | "todos"
  | "login"
  | "calculo"
  | "copia"
  | "navegacao"
  | "usuario"
  | "limpeza"
const ACTIVITY_LOG_LIMIT = 100
const LOGS_PAGE_SIZE = 50

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [activeTab, setActiveTab] = useState<TabType>("dashboard")
  const [successMessage, setSuccessMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [filterUser, setFilterUser] = useState<string>("todos")
  const [filterActivityType, setFilterActivityType] = useState<ActivityFilterType>("todos")
  const [activitySearchTerm, setActivitySearchTerm] = useState("")
  const [logsPage, setLogsPage] = useState(1)
  const [autoRefreshLogs, setAutoRefreshLogs] = useState(true)
  const [selectedUserDetails, setSelectedUserDetails] = useState<string | null>(null)
  const [monitorSearchTerm, setMonitorSearchTerm] = useState("")
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<MonitoringStatusFilter>("todos")
  const [dbStats, setDbStats] = useState<DbStats | null>(null)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [refreshingOverview, setRefreshingOverview] = useState(false)
  const [loadingDb, setLoadingDb] = useState(false)
  const [clearingData, setClearingData] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [updatingOwnPassword, setUpdatingOwnPassword] = useState(false)
  const [lastRefreshAt, setLastRefreshAt] = useState<string | null>(null)
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()

  const readApiError = useCallback(async (response: Response) => {
    try {
      const body = await response.json()
      if (typeof body?.error === "string" && body.error.trim().length > 0) {
        return body.error
      }
    } catch {
      // Ignora erro de parse para manter fallback textual.
    }

    return `Erro na requisicao (${response.status})`
  }, [])

  const showSuccess = useCallback((message: string) => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current)
    }
    setSuccessMessage(message)
    successTimeoutRef.current = setTimeout(() => setSuccessMessage(""), 3000)
  }, [])

  const showError = useCallback((message: string) => {
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
    setErrorMessage(message)
    errorTimeoutRef.current = setTimeout(() => setErrorMessage(""), 5000)
  }, [])

  const loadActivities = useCallback(async (options?: { silent?: boolean; includeStats?: boolean }) => {
    const silent = options?.silent ?? false
    const includeStats = options?.includeStats ?? true
    setLoadingActivities(true)
    try {
      const query = new URLSearchParams({
        limit: String(ACTIVITY_LOG_LIMIT),
        includeStats: includeStats ? "true" : "false",
      })

      const response = await fetch(`/api/activity?${query.toString()}`, { cache: "no-store" })
      if (!response.ok) {
        if (!silent) {
          showError(await readApiError(response))
        }
        return
      }

      const data = await response.json()
      setActivityLogs(data.logs || [])
      if (data.stats) {
        setStats(data.stats)
      }
      setLastRefreshAt(new Date().toISOString())
    } catch (error) {
      console.error("Erro ao carregar atividades:", error)
      if (!silent) {
        showError("Nao foi possivel carregar atividades.")
      }
    } finally {
      setLoadingActivities(false)
    }
  }, [readApiError, showError])

  const loadDbStats = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false
    setLoadingDb(true)
    try {
      const response = await fetch("/api/db/stats", { cache: "no-store" })
      if (!response.ok) {
        if (!silent) {
          showError(await readApiError(response))
        }
        return
      }

      const data = await response.json()
      setDbStats(data)
      setLastRefreshAt(new Date().toISOString())
    } catch (error) {
      console.error("Erro ao carregar estatisticas do banco:", error)
      if (!silent) {
        showError("Nao foi possivel carregar estatisticas do banco.")
      }
    } finally {
      setLoadingDb(false)
    }
  }, [readApiError, showError])

  const loadData = useCallback(async (): Promise<boolean> => {
    try {
      const meResponse = await fetch("/api/auth/me", { cache: "no-store" })
      if (!meResponse.ok) {
        showError(await readApiError(meResponse))
        router.push("/login")
        return false
      }
      const meData = (await meResponse.json()) as { user: CurrentUser }
      setCurrentUser(meData.user)

      if (meData.user.role !== "admin") {
        router.push("/")
        return false
      }

      const usersResponse = await fetch("/api/users", { cache: "no-store" })
      if (!usersResponse.ok) {
        showError(await readApiError(usersResponse))
        return false
      }

      const usersData = await usersResponse.json()
      setUsers(usersData.users || [])
      setLastRefreshAt(new Date().toISOString())
      return true
    } catch (error) {
      console.error("Erro ao carregar dados:", error)
      showError("Nao foi possivel carregar os dados do painel.")
      return false
    } finally {
      setLoading(false)
    }
  }, [readApiError, router, showError])

  const refreshOverview = useCallback(async () => {
    setRefreshingOverview(true)
    try {
      const isAdmin = await loadData()
      if (!isAdmin) {
        return
      }

      await Promise.all([loadActivities({ silent: true, includeStats: true }), loadDbStats({ silent: true })])
      setLastRefreshAt(new Date().toISOString())
      showSuccess("Painel atualizado.")
    } catch {
      showError("Nao foi possivel atualizar o painel.")
    } finally {
      setRefreshingOverview(false)
    }
  }, [loadActivities, loadData, loadDbStats, showError, showSuccess])

  const handleClearData = async (table: "activity_logs" | "orcamentos", olderThanDays?: number) => {
    const confirmMsg = olderThanDays
      ? `Tem certeza que deseja apagar logs mais antigos que ${olderThanDays} dias?`
      : `Tem certeza que deseja limpar todos os dados de ${table}? Esta acao nao pode ser desfeita.`

    if (!confirm(confirmMsg)) return

    setClearingData(true)
    try {
      const response = await fetch("/api/db/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ table, olderThanDays }),
      })

      if (!response.ok) {
        showError(await readApiError(response))
        return
      }

      const data = await response.json()
      showSuccess(data.message)
      await Promise.all([
        loadDbStats({ silent: true }),
        loadActivities({ silent: true, includeStats: true }),
      ])
      setLastRefreshAt(new Date().toISOString())
    } catch (error) {
      console.error("Erro ao limpar dados:", error)
      showError("Nao foi possivel limpar os dados.")
    } finally {
      setClearingData(false)
    }
  }

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const bootstrap = async () => {
      const isAdmin = await loadData()
      if (!isAdmin || cancelled) {
        return
      }

      await loadActivities({ silent: true, includeStats: true })

      interval = setInterval(() => {
        if (!autoRefreshLogs) {
          return
        }
        if (activeTab !== "dashboard" && activeTab !== "atividades" && activeTab !== "monitoramento") {
          return
        }
        if (typeof document !== "undefined" && document.hidden) {
          return
        }
        void loadActivities({ silent: true, includeStats: false })
      }, 30000)
    }

    void bootstrap()

    const handleVisibilityChange = () => {
      if (!autoRefreshLogs) {
        return
      }
      if (activeTab !== "dashboard" && activeTab !== "atividades" && activeTab !== "monitoramento") {
        return
      }
      if (typeof document !== "undefined" && !document.hidden) {
        void loadActivities({ silent: true, includeStats: false })
      }
    }

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleVisibilityChange)
    }

    return () => {
      cancelled = true
      if (interval) {
        clearInterval(interval)
      }
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleVisibilityChange)
      }
    }
  }, [activeTab, autoRefreshLogs, loadActivities, loadData, loadDbStats])

  useEffect(() => {
    if (activeTab !== "banco" || dbStats) {
      return
    }

    void loadDbStats({ silent: true })
  }, [activeTab, dbStats, loadDbStats])

  useEffect(() => {
    setLogsPage(1)
  }, [activitySearchTerm, filterActivityType, filterUser])

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current)
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
    }
  }, [])

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setCreatingUser(true)
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: newUsername,
          password: newPassword,
          role: "funcionario",
        }),
      })

      if (!response.ok) {
        showError(await readApiError(response))
        return
      }

      setNewUsername("")
      setNewPassword("")
      setShowCreateForm(false)
      await loadData()
      showSuccess("Funcionario criado com sucesso!")
    } catch (error) {
      console.error("Erro ao criar usuario:", error)
      showError("Nao foi possivel criar o usuario.")
    } finally {
      setCreatingUser(false)
    }
  }

  const handleUpdatePassword = async (userId: string) => {
    if (editPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setUpdatingUserId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: editPassword }),
      })

      if (!response.ok) {
        showError(await readApiError(response))
        return
      }

      setEditingUserId(null)
      setEditPassword("")
      showSuccess("Senha atualizada com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      showError("Nao foi possivel atualizar a senha.")
    } finally {
      setUpdatingUserId(null)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    const user = users.find((u) => u.id === userId)
    if (!confirm(`Tem certeza que deseja excluir ${user?.username}? Esta acao nao pode ser desfeita.`)) return

    setDeletingUserId(userId)
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        showError(await readApiError(response))
        return
      }

      await loadData()
      showSuccess("Usuario excluido com sucesso!")
    } catch (error) {
      console.error("Erro ao excluir usuario:", error)
      showError("Nao foi possivel excluir o usuario.")
    } finally {
      setDeletingUserId(null)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
    router.refresh()
  }

  const handleUpdateOwnPassword = async () => {
    if (!newAdminPassword || newAdminPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }
    if (newAdminPassword !== confirmPassword) {
      alert("As senhas nao coincidem")
      return
    }

    setUpdatingOwnPassword(true)
    try {
      if (!currentUser) {
        showError("Usuario atual nao encontrado.")
        return
      }

      const response = await fetch(`/api/users/${currentUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newAdminPassword }),
      })

      if (!response.ok) {
        showError(await readApiError(response))
        return
      }

      setNewAdminPassword("")
      setConfirmPassword("")
      showSuccess("Sua senha foi alterada com sucesso!")
    } catch (error) {
      console.error("Erro ao atualizar senha:", error)
      showError("Erro ao atualizar senha")
    } finally {
      setUpdatingOwnPassword(false)
    }
  }

  const totalFuncionarios = users.filter((u) => u.role === "funcionario").length
  const totalAdmins = users.filter((u) => u.role === "admin").length
  const totalUsuarios = users.length

  const resolveActivityType = useCallback((action: string): ActivityFilterType => {
    const normalized = action.toLowerCase()
    if (normalized === "login") return "login"
    if (normalized.includes("calculou")) return "calculo"
    if (normalized.includes("copiou")) return "copia"
    if (normalized.includes("acessou") || normalized.includes("navegou")) return "navegacao"
    if (normalized.includes("limpou")) return "limpeza"
    return "usuario"
  }, [])

  const filteredUsers = useMemo(
    () => users.filter((user) => user.username.toLowerCase().includes(searchTerm.toLowerCase())),
    [searchTerm, users],
  )

  const filteredActivities = useMemo(
    () =>
      activityLogs.filter((log) => {
        const matchUser = filterUser === "todos" || log.username === filterUser
        const matchType =
          filterActivityType === "todos" || resolveActivityType(log.action) === filterActivityType
        const normalizedSearch = activitySearchTerm.trim().toLowerCase()
        const matchSearch =
          normalizedSearch.length === 0 ||
          log.action.toLowerCase().includes(normalizedSearch) ||
          (log.details || "").toLowerCase().includes(normalizedSearch) ||
          (log.page || "").toLowerCase().includes(normalizedSearch)

        return matchUser && matchType && matchSearch
      }),
    [activityLogs, activitySearchTerm, filterActivityType, filterUser, resolveActivityType],
  )

  const totalLogsPages = Math.max(1, Math.ceil(filteredActivities.length / LOGS_PAGE_SIZE))
  const currentLogsPage = Math.min(logsPage, totalLogsPages)

  const paginatedActivities = useMemo(() => {
    const start = (currentLogsPage - 1) * LOGS_PAGE_SIZE
    return filteredActivities.slice(start, start + LOGS_PAGE_SIZE)
  }, [currentLogsPage, filteredActivities])

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "-"
    try {
      const date = new Date(dateString)
      return date.toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch {
      return "-"
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return "-"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bom dia"
    if (hour < 18) return "Boa tarde"
    return "Boa noite"
  }

  const openLocationInMaps = (lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener,noreferrer")
  }

  const exportFilteredActivities = () => {
    if (filteredActivities.length === 0) {
      showError("Nao ha logs para exportar com os filtros atuais.")
      return
    }

    const escapeCsv = (value: string | null | undefined) => {
      const safeValue = value ?? ""
      return `"${safeValue.replace(/"/g, '""')}"`
    }

    const csvHeader = ["Usuario", "Acao", "Detalhes", "Pagina", "Data", "Latitude", "Longitude"]
    const csvRows = filteredActivities.map((log) => [
      escapeCsv(log.username),
      escapeCsv(log.action),
      escapeCsv(log.details),
      escapeCsv(log.page),
      escapeCsv(log.created_at),
      escapeCsv(log.latitude ? String(log.latitude) : ""),
      escapeCsv(log.longitude ? String(log.longitude) : ""),
    ])

    const csvContent = [csvHeader.join(","), ...csvRows.map((row) => row.join(","))].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `logs-admin-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)

    showSuccess("Exportacao de logs concluida.")
  }

  const lastRefreshLabel = lastRefreshAt ? formatDateTime(lastRefreshAt) : "Ainda nao sincronizado"

  const monitoringCards = useMemo<MonitoringCardData[]>(() => {
    const logsByUsername = new Map<string, ActivityLog[]>()
    const now = Date.now()
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayStartMs = todayStart.getTime()

    for (const log of activityLogs) {
      const bucket = logsByUsername.get(log.username)
      if (bucket) {
        bucket.push(log)
      } else {
        logsByUsername.set(log.username, [log])
      }
    }

    return users
      .filter((u) => u.role === "funcionario")
      .map((user) => {
        const userLogs = [...(logsByUsername.get(user.username) || [])].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
          lastLogin: userLogs.find((l) => l.action === "Login"),
          calculos: userLogs.filter((l) => l.action.includes("Calculou")).length,
          copias: userLogs.filter((l) => l.action.includes("Copiou")).length,
          navegacoes: userLogs.filter((l) => l.action.includes("Acessou") || l.action.includes("Navegou")).length,
          acoesHoje: userLogs.filter((l) => new Date(l.created_at).getTime() >= todayStartMs).length,
          totalAcoes: userLogs.length,
          paginasUnicas: new Set(userLogs.map((l) => l.page).filter(Boolean)).size,
          status,
          lastLocation: userLogs.find((l) => l.latitude && l.longitude),
        }
      })
      .sort((a, b) => {
        const activityA = a.lastActivity ? new Date(a.lastActivity.created_at).getTime() : 0
        const activityB = b.lastActivity ? new Date(b.lastActivity.created_at).getTime() : 0
        return activityB - activityA
      })
  }, [activityLogs, users])

  const monitoringSummary = useMemo(() => {
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
        const search = monitorSearchTerm.trim().toLowerCase()
        const matchesSearch = search.length === 0 || card.user.username.toLowerCase().includes(search)
        const matchesStatus = monitorStatusFilter === "todos" || card.status === monitorStatusFilter
        return matchesSearch && matchesStatus
      }),
    [monitorSearchTerm, monitorStatusFilter, monitoringCards],
  )

  const getMonitoringStatusClasses = (status: MonitoringStatus) => {
    if (status === "ativo") {
      return "bg-green-100 text-green-700"
    }
    if (status === "atencao") {
      return "bg-yellow-100 text-yellow-700"
    }
    return "bg-gray-100 text-gray-700"
  }

  const getMonitoringStatusLabel = (status: MonitoringStatus) => {
    if (status === "ativo") {
      return "Ativo"
    }
    if (status === "atencao") {
      return "Atencao"
    }
    return "Inativo"
  }

  const tabs = [
    { id: "dashboard" as TabType, label: "Inicio" },
    { id: "funcionarios" as TabType, label: "Equipe" },
    { id: "atividades" as TabType, label: "Logs" },
    { id: "monitoramento" as TabType, label: "Monitor" },
    { id: "banco" as TabType, label: "Banco" },
    { id: "perfil" as TabType, label: "Perfil" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg text-gray-800 font-semibold">Carregando...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center">
          {successMessage}
        </div>
      )}
      {errorMessage && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Header responsivo */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="px-3 md:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <Image src="/logo.png" alt="Logo" width={100} height={25} className="h-6 md:h-8 w-auto" />
              <span className="hidden md:inline text-lg font-bold text-gray-900 border-l border-gray-200 pl-4">
                Painel Admin
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                {currentUser?.username?.charAt(0).toUpperCase()}
              </div>
              <Button
                onClick={() => router.push("/")}
                size="sm"
                variant="outline"
                className="hidden md:flex text-xs px-2"
              >
                Calculadoras
              </Button>
              <Button
                onClick={handleLogout}
                size="sm"
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent text-xs px-2"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs responsivas */}
        <div className="border-t border-gray-200 overflow-x-auto">
          <nav className="flex px-2 md:px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
                  activeTab === tab.id ? "border-red-600 text-red-600" : "border-transparent text-gray-600"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="px-3 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
        {/* Dashboard Tab */}
        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="bg-red-600 rounded-xl p-4 md:p-6 text-white">
              <h2 className="text-lg md:text-2xl font-bold">
                {getGreeting()}, {currentUser?.username}!
              </h2>
              <p className="text-red-100 text-sm">Painel de controle</p>
              <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <p className="text-red-100 text-xs">Ultima atualizacao: {lastRefreshLabel}</p>
                <Button
                  onClick={refreshOverview}
                  size="sm"
                  disabled={refreshingOverview}
                  className="bg-white text-red-600 hover:bg-red-50 text-xs w-full sm:w-auto"
                >
                  {refreshingOverview ? "Atualizando..." : "Atualizar painel"}
                </Button>
              </div>
            </div>

            {/* Cards de estatisticas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4">
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Usuarios</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{totalUsuarios}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Funcionarios</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{totalFuncionarios}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Admins</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{totalAdmins}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Logs Hoje</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.todayLogs || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Orcamentos</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{stats?.calculoCount || 0}</p>
              </div>
            </div>

            {/* Atividades recentes e acesso rapido */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm md:text-base font-bold text-gray-900">Atividades Recentes</h3>
                  <button onClick={() => setActiveTab("atividades")} className="text-xs text-red-600 font-medium">
                    Ver todas
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activityLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-xs">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-gray-900">{log.username}</span>
                          {log.latitude && log.longitude && (
                            <button
                              onClick={() => openLocationInMaps(log.latitude!, log.longitude!)}
                              className="text-blue-500 text-xs"
                            >
                              Mapa
                            </button>
                          )}
                        </div>
                        <p className="text-gray-600 truncate">{log.action}</p>
                        <p className="text-gray-400 text-xs">{formatDateTime(log.created_at)}</p>
                      </div>
                    </div>
                  ))}
                  {activityLogs.length === 0 && (
                    <p className="text-gray-500 text-center py-4 text-sm">Nenhuma atividade registrada</p>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3">Acesso Rapido</h3>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    { name: "Baratinha", href: "/baratinha" },
                    { name: "Barata", href: "/barata-esgoto" },
                    { name: "Rato", href: "/rato" },
                    { name: "Escorpiao", href: "/escorpiao" },
                    { name: "Formiga", href: "/formiga" },
                    { name: "Cupim", href: "/cupim" },
                    { name: "Aranha", href: "/aranha-mosquito-traca" },
                    { name: "Pulga", href: "/pulga-carrapato-percevejo" },
                  ].map((item) => (
                    <button
                      key={item.href}
                      onClick={() => router.push(item.href)}
                      className="p-2 md:p-3 text-xs rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-center font-medium active:scale-95"
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Funcionarios Tab */}
        {activeTab === "funcionarios" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Equipe</h2>
                <p className="text-gray-600 text-xs md:text-sm">Gerencie funcionarios</p>
              </div>
              <Button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs w-full sm:w-auto"
                size="sm"
                disabled={creatingUser}
              >
                {showCreateForm ? "Cancelar" : "+ Novo"}
              </Button>
            </div>

            {showCreateForm && (
              <div className="bg-white rounded-xl shadow-sm border p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Novo Funcionario</h3>
                <form onSubmit={handleCreateUser} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="newUsername" className="text-xs">
                        Usuario
                      </Label>
                      <Input
                        id="newUsername"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        disabled={creatingUser}
                        required
                        placeholder="Ex: JoaoMk"
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="newPassword" className="text-xs">
                        Senha
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        disabled={creatingUser}
                        required
                        placeholder="Min 6 caracteres"
                        className="mt-1 text-sm"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={creatingUser} className="bg-red-600 hover:bg-red-700 w-full text-sm">
                    {creatingUser ? "Criando..." : "Criar Funcionario"}
                  </Button>
                </form>
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border p-3">
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="text-sm"
              />
            </div>

            {/* Lista de usuarios para mobile */}
            <div className="space-y-2 md:hidden">
              {filteredUsers.map((user) => (
                <div key={user.id} className="bg-white rounded-xl shadow-sm border p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.role === "admin" ? "bg-red-600" : "bg-gray-500"}`}
                      >
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-gray-500">{user.role === "admin" ? "Admin" : "Funcionario"}</p>
                      </div>
                    </div>
                    {user.role !== "admin" && (
                      <div className="flex gap-1">
                        {editingUserId === user.id ? (
                          <div className="flex gap-1">
                            <Input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="Nova senha"
                              disabled={updatingUserId === user.id}
                              className="w-24 h-7 text-xs"
                            />
                            <Button
                              size="sm"
                              onClick={() => handleUpdatePassword(user.id)}
                              disabled={updatingUserId === user.id}
                              className="bg-green-600 h-7 text-xs px-2"
                            >
                              {updatingUserId === user.id ? "..." : "OK"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUserId(null)}
                              disabled={updatingUserId === user.id}
                              className="h-7 text-xs px-2"
                            >
                              X
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingUserId(user.id)}
                              className="h-7 text-xs px-2"
                            >
                              Senha
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-200 h-7 text-xs px-2 bg-transparent"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deletingUserId === user.id}
                            >
                              {deletingUserId === user.id ? "..." : "X"}
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-gray-500 text-center py-6 text-sm bg-white rounded-xl shadow-sm border">
                  Nenhum usuario encontrado para o filtro informado.
                </p>
              )}
            </div>

            {/* Tabela para desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Usuario</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Cargo</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Criado em</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-900">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.role === "admin" ? "bg-red-600" : "bg-gray-500"}`}
                          >
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${user.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"}`}
                        >
                          {user.role === "admin" ? "Admin" : "Funcionario"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.created_at)}</td>
                      <td className="px-4 py-3 text-right">
                        {user.role !== "admin" && (
                          <div className="flex items-center justify-end gap-2">
                            {editingUserId === user.id ? (
                              <>
                                <Input
                                  type="password"
                                  value={editPassword}
                                  onChange={(e) => setEditPassword(e.target.value)}
                                  placeholder="Nova senha"
                                  disabled={updatingUserId === user.id}
                                  className="w-28 h-7 text-xs"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdatePassword(user.id)}
                                  disabled={updatingUserId === user.id}
                                  className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                                >
                                  {updatingUserId === user.id ? "Salvando..." : "Salvar"}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUserId(null)}
                                  disabled={updatingUserId === user.id}
                                  className="h-7 text-xs"
                                >
                                  Cancelar
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingUserId(user.id)}
                                  className="h-7 text-xs"
                                >
                                  Alterar Senha
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent h-7 text-xs"
                                  onClick={() => handleDeleteUser(user.id)}
                                  disabled={deletingUserId === user.id}
                                >
                                  {deletingUserId === user.id ? "Excluindo..." : "Excluir"}
                                </Button>
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                        Nenhum usuario encontrado para o filtro informado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Atividades Tab */}
        {activeTab === "atividades" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Logs de Atividades</h2>
                <p className="text-gray-600 text-xs md:text-sm">
                  {filteredActivities.length} logs encontrados com os filtros atuais
                </p>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setAutoRefreshLogs((current) => !current)}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent flex-1 sm:flex-none"
                >
                  {autoRefreshLogs ? "Auto: ON" : "Auto: OFF"}
                </Button>
                <Button
                  onClick={() => exportFilteredActivities()}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent flex-1 sm:flex-none"
                >
                  Exportar CSV
                </Button>
                <Button
                  onClick={() => loadActivities({ includeStats: true })}
                  variant="outline"
                  size="sm"
                  className="text-xs bg-transparent flex-1 sm:flex-none"
                  disabled={loadingActivities}
                >
                  {loadingActivities ? "Atualizando..." : "Atualizar"}
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Usuario</Label>
                  <select
                    value={filterUser}
                    onChange={(e) => setFilterUser(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.username}>
                        {u.username}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Tipo de acao</Label>
                  <select
                    value={filterActivityType}
                    onChange={(e) => setFilterActivityType(e.target.value as ActivityFilterType)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="login">Login</option>
                    <option value="calculo">Calculos</option>
                    <option value="copia">Copias</option>
                    <option value="navegacao">Navegacao</option>
                    <option value="usuario">Usuarios</option>
                    <option value="limpeza">Limpeza</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs">Busca em acao/detalhes/pagina</Label>
                  <Input
                    value={activitySearchTerm}
                    onChange={(e) => setActivitySearchTerm(e.target.value)}
                    placeholder="Ex: calculou, /baratinha, login..."
                    className="mt-1 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Lista de logs para mobile */}
            <div className="space-y-2 md:hidden">
              {paginatedActivities.map((log) => (
                <div key={log.id} className="bg-white rounded-xl shadow-sm border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{log.username}</span>
                        {log.latitude && log.longitude && (
                          <button
                            onClick={() => openLocationInMaps(log.latitude!, log.longitude!)}
                            className="text-blue-500 text-xs"
                          >
                            Mapa
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{log.action}</p>
                      {log.details && <p className="text-xs text-gray-500 truncate">{log.details}</p>}
                      <p className="text-xs text-gray-400 mt-1">{formatDateTime(log.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredActivities.length === 0 && (
                <p className="text-gray-500 text-center py-6 text-sm bg-white rounded-xl shadow-sm border">
                  Nenhum log encontrado para o filtro selecionado.
                </p>
              )}
            </div>

            {/* Tabela para desktop */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="max-h-[500px] overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b sticky top-0">
                    <tr>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-900">Usuario</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-900">Acao</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-900">Detalhes</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-900">Local</th>
                      <th className="text-left px-3 py-2 text-xs font-semibold text-gray-900">Data/Hora</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {paginatedActivities.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 text-xs font-medium">{log.username}</td>
                        <td className="px-3 py-2 text-xs">{log.action}</td>
                        <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{log.details || "-"}</td>
                        <td className="px-3 py-2">
                          {log.latitude && log.longitude ? (
                            <button
                              onClick={() => openLocationInMaps(log.latitude!, log.longitude!)}
                              className="text-blue-600 hover:text-blue-800 text-xs underline"
                            >
                              Ver mapa
                            </button>
                          ) : (
                            <span className="text-gray-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-xs text-gray-500">{formatDateTime(log.created_at)}</td>
                      </tr>
                    ))}
                    {filteredActivities.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-3 py-8 text-center text-sm text-gray-500">
                          Nenhum log encontrado para o filtro selecionado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                Pagina {currentLogsPage} de {totalLogsPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setLogsPage((page) => Math.max(1, page - 1))}
                  disabled={currentLogsPage <= 1}
                >
                  Anterior
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => setLogsPage((page) => Math.min(totalLogsPages, page + 1))}
                  disabled={currentLogsPage >= totalLogsPages}
                >
                  Proxima
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Monitoramento Tab */}
        {activeTab === "monitoramento" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Monitoramento</h2>
              <p className="text-gray-600 text-xs md:text-sm">Acompanhe cada funcionario</p>
              <p className="text-gray-500 text-xs mt-1">Dados com base nos ultimos {ACTIVITY_LOG_LIMIT} logs coletados.</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              <div className="bg-white rounded-xl shadow-sm border p-3">
                <p className="text-xs text-gray-500">Equipe Monitorada</p>
                <p className="text-xl font-bold text-gray-900">{monitoringSummary.total}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-3">
                <p className="text-xs text-gray-500">Ativos (30 min)</p>
                <p className="text-xl font-bold text-green-700">{monitoringSummary.active}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-3">
                <p className="text-xs text-gray-500">Atencao (24h)</p>
                <p className="text-xl font-bold text-yellow-700">{monitoringSummary.attention}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-3">
                <p className="text-xs text-gray-500">Inativos</p>
                <p className="text-xl font-bold text-gray-700">{monitoringSummary.inactive}</p>
              </div>
              <div className="bg-white rounded-xl shadow-sm border p-3 col-span-2 md:col-span-1">
                <p className="text-xs text-gray-500">Sem Login</p>
                <p className="text-xl font-bold text-red-700">{monitoringSummary.withoutLogin}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Buscar funcionaria</Label>
                  <Input
                    value={monitorSearchTerm}
                    onChange={(e) => setMonitorSearchTerm(e.target.value)}
                    placeholder="Digite o usuario..."
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs">Status</Label>
                  <select
                    value={monitorStatusFilter}
                    onChange={(e) => setMonitorStatusFilter(e.target.value as MonitoringStatusFilter)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="todos">Todos</option>
                    <option value="ativo">Ativo</option>
                    <option value="atencao">Atencao</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={() => loadActivities({ includeStats: true })}
                    variant="outline"
                    size="sm"
                    className="text-xs bg-transparent w-full md:w-auto"
                    disabled={loadingActivities}
                  >
                    {loadingActivities ? "Atualizando..." : "Atualizar monitoramento"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredMonitoringCards.map(
                ({
                  user,
                  userLogs,
                  lastActivity,
                  lastLogin,
                  calculos,
                  copias,
                  navegacoes,
                  acoesHoje,
                  totalAcoes,
                  paginasUnicas,
                  status,
                  lastLocation,
                }) => (
                <div key={user.id} className="bg-white rounded-xl shadow-sm border p-3">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                    <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm">{user.username}</h3>
                      <p className="text-xs text-gray-500 truncate">
                        Ultima atividade: {lastActivity ? formatDateTime(lastActivity.created_at) : "Sem dados"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Ultimo login: {lastLogin ? formatDateTime(lastLogin.created_at) : "Nunca"}
                      </p>
                    </div>
                  </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getMonitoringStatusClasses(status)}`}>
                      {getMonitoringStatusLabel(status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <div className="bg-blue-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-blue-600">{calculos}</p>
                      <p className="text-xs text-blue-600">Calculos</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-2 text-center">
                      <p className="text-lg font-bold text-purple-600">{copias}</p>
                      <p className="text-xs text-purple-600">Copias</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-700">{navegacoes}</p>
                      <p className="text-[10px] text-gray-500">Navegacoes</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-700">{acoesHoje}</p>
                      <p className="text-[10px] text-gray-500">Hoje</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-2 text-center">
                      <p className="text-sm font-bold text-gray-700">{paginasUnicas}</p>
                      <p className="text-[10px] text-gray-500">Paginas</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 mb-2">Total de acoes registradas: {totalAcoes}</p>
                  {lastLocation && lastLocation.latitude && lastLocation.longitude && (
                    <button
                      onClick={() => openLocationInMaps(lastLocation.latitude!, lastLocation.longitude!)}
                      className="w-full py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1"
                    >
                      Mapa Ver localizacao
                    </button>
                  )}
                  <button
                    onClick={() =>
                      setSelectedUserDetails(selectedUserDetails === user.username ? null : user.username)
                    }
                    className="w-full mt-2 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {selectedUserDetails === user.username ? "Fechar" : "Ver detalhes"}
                  </button>

                  {selectedUserDetails === user.username && (
                    <div className="mt-2 pt-2 border-t max-h-32 overflow-y-auto">
                      {userLogs.slice(0, 10).map((log) => (
                        <div key={log.id} className="text-xs py-1 border-b border-gray-100">
                          <span className="text-gray-500">{formatDateTime(log.created_at)}</span> - {log.action}
                          {log.latitude && log.longitude && (
                            <button
                              onClick={() => openLocationInMaps(log.latitude!, log.longitude!)}
                              className="ml-1 text-blue-500"
                            >
                              Mapa
                            </button>
                          )}
                        </div>
                      ))}
                      {userLogs.length === 0 && <p className="text-xs text-gray-500 py-2">Sem atividades recentes.</p>}
                    </div>
                  )}
                </div>
              ))}
              {filteredMonitoringCards.length === 0 && (
                <p className="text-gray-500 text-center py-8 col-span-full">
                  Nenhuma funcionaria encontrada para os filtros atuais.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Banco de Dados Tab */}
        {activeTab === "banco" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900">Banco de Dados</h2>
                <p className="text-gray-600 text-xs md:text-sm">Monitore o armazenamento</p>
              </div>
              <Button
                onClick={() => loadDbStats()}
                variant="outline"
                disabled={loadingDb}
                size="sm"
                className="text-xs bg-transparent"
              >
                {loadingDb ? "Atualizando..." : "Atualizar"}
              </Button>
            </div>

            {/* Cards de estatisticas do banco */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Total Registros</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{dbStats?.totalRecords || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Tamanho</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{dbStats?.estimatedSizeMB || 0} MB</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Logs 7 Dias</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{dbStats?.logsLast7Days || 0}</p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border">
                <p className="text-xs text-gray-500">Uso</p>
                <p className="text-xl md:text-2xl font-bold text-gray-900">{dbStats?.usagePercent || 0}%</p>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Uso do Armazenamento</h3>
              <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                <div
                  className={`h-3 rounded-full transition-all ${(dbStats?.usagePercent || 0) > 80 ? "bg-red-500" : (dbStats?.usagePercent || 0) > 50 ? "bg-yellow-500" : "bg-green-500"}`}
                  style={{ width: `${Math.min(dbStats?.usagePercent || 0, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500">
                {dbStats?.totalRecords || 0} de {dbStats?.maxFreeRecords?.toLocaleString() || "500,000"} registros
              </p>
            </div>

            {/* Detalhes por tabela */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Por Tabela</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">Usuarios</span>
                  <span className="font-bold">{dbStats?.tables?.users || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">Logs</span>
                  <span className="font-bold">{dbStats?.tables?.activity_logs || 0}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <span className="text-sm">Orcamentos</span>
                  <span className="font-bold">{dbStats?.tables?.orcamentos || 0}</span>
                </div>
              </div>
            </div>

            {/* Acoes de limpeza */}
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Limpeza de Dados</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearData("activity_logs", 30)}
                  disabled={clearingData}
                  className="text-xs"
                >
                  Logs +30 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearData("activity_logs", 7)}
                  disabled={clearingData}
                  className="text-xs"
                >
                  Logs +7 dias
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearData("activity_logs")}
                  disabled={clearingData}
                  className="text-xs text-orange-600 border-orange-200"
                >
                  Todos Logs
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleClearData("orcamentos")}
                  disabled={clearingData}
                  className="text-xs text-red-600 border-red-200"
                >
                  Orcamentos
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Perfil Tab */}
        {activeTab === "perfil" && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg md:text-xl font-bold text-gray-900">Meu Perfil</h2>
              <p className="text-gray-600 text-xs md:text-sm">Gerencie sua conta</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {currentUser?.username?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{currentUser?.username}</h3>
                  <p className="text-sm text-red-600 font-medium">Proprietario / Admin</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h3 className="font-bold text-gray-900 text-sm mb-3">Alterar Senha</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="newAdminPassword" className="text-xs">
                    Nova Senha
                  </Label>
                  <Input
                    id="newAdminPassword"
                    type="password"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                    disabled={updatingOwnPassword}
                    placeholder="Minimo 6 caracteres"
                    className="mt-1 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-xs">
                    Confirmar Senha
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={updatingOwnPassword}
                    placeholder="Repita a senha"
                    className="mt-1 text-sm"
                  />
                </div>
                <Button
                  onClick={handleUpdateOwnPassword}
                  disabled={updatingOwnPassword}
                  className="w-full bg-red-600 hover:bg-red-700 text-sm"
                >
                  {updatingOwnPassword ? "Salvando..." : "Salvar Nova Senha"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

