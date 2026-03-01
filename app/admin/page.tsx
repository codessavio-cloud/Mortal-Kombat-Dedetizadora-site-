"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { ActivityTab } from "@/components/admin/activity-tab"
import { AdminHeader } from "@/components/admin/admin-header"
import { DashboardTab } from "@/components/admin/dashboard-tab"
import { DatabaseTab } from "@/components/admin/database-tab"
import { MonitoringTab } from "@/components/admin/monitoring-tab"
import { ProfileTab } from "@/components/admin/profile-tab"
import { UsersTab } from "@/components/admin/users-tab"
import { ADMIN_ACTIVITY_OVERVIEW_LIMIT, ADMIN_TABS } from "@/lib/admin/constants"
import { formatDate, formatDateTime, getGreeting } from "@/lib/admin/formatters"
import type {
  AdminActivityFilterType,
  AdminTabType,
  MonitoringStatusFilter,
} from "@/lib/admin/types"
import { adminApi, getErrorMessage } from "@/lib/api/admin-client"
import { useAdminActivity } from "@/hooks/admin/use-admin-activity"
import { useAdminDbStats } from "@/hooks/admin/use-admin-db-stats"
import { useAdminNotifications } from "@/hooks/admin/use-admin-notifications"
import { useAdminSession } from "@/hooks/admin/use-admin-session"
import { useAdminUsers } from "@/hooks/admin/use-admin-users"

export default function AdminPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<AdminTabType>("dashboard")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [updatingOwnPassword, setUpdatingOwnPassword] = useState(false)

  const notifications = useAdminNotifications()
  const { currentUser, loadingSession, loggingOut, ensureAdminSession, logout } = useAdminSession({
    onError: notifications.showError,
  })

  const users = useAdminUsers({
    enabled: Boolean(currentUser),
    onError: notifications.showError,
    onSuccess: notifications.showSuccess,
  })

  const activity = useAdminActivity({
    enabled: Boolean(currentUser),
    activeTab,
    users: users.allUsers,
    onError: notifications.showError,
    onSuccess: notifications.showSuccess,
  })

  const dbStats = useAdminDbStats({
    enabled: Boolean(currentUser),
    activeTab,
    onError: notifications.showError,
    onSuccess: notifications.showSuccess,
    onAfterClear: async () => {
      await Promise.all([
        activity.loadOverview({ includeStats: true, silent: true }),
        activity.loadActivityPage({ includeStats: true, silent: true }),
      ])
    },
  })

  useEffect(() => {
    void ensureAdminSession()
  }, [ensureAdminSession])

  const openLocationInMaps = useCallback((lat: number, lng: number) => {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank", "noopener,noreferrer")
  }, [])

  const handleUpdateOwnPassword = useCallback(async () => {
    if (!newAdminPassword || newAdminPassword.length < 6) {
      alert("A senha deve ter pelo menos 6 caracteres")
      return
    }
    if (newAdminPassword !== confirmPassword) {
      alert("As senhas nao coincidem")
      return
    }

    if (!currentUser) {
      notifications.showError("Usuario atual nao encontrado.")
      return
    }

    setUpdatingOwnPassword(true)
    try {
      await adminApi.patch<{ success: boolean }>(`/api/users/${currentUser.id}`, {
        password: newAdminPassword,
      })
      setNewAdminPassword("")
      setConfirmPassword("")
      notifications.showSuccess("Sua senha foi alterada com sucesso!")
    } catch (error) {
      notifications.showError(getErrorMessage(error, "Erro ao atualizar senha."))
    } finally {
      setUpdatingOwnPassword(false)
    }
  }, [confirmPassword, currentUser, newAdminPassword, notifications])

  const handleRefreshOverview = useCallback(async () => {
    await Promise.all([
      users.loadUsers(),
      activity.refreshOverview(),
      dbStats.loadDbStats({ silent: true }),
    ])
  }, [activity, dbStats, users])

  const handleShowAllLogs = useCallback(() => setActiveTab("atividades"), [])

  const handleToggleUserDetails = useCallback(
    (username: string) => {
      activity.setSelectedUserDetails((current) => (current === username ? null : username))
    },
    [activity],
  )

  const handleGoToCalculators = useCallback(() => {
    router.push("/")
  }, [router])

  const handleActivityTypeChange = useCallback(
    (value: string) => {
      activity.setFilterActivityType(value as AdminActivityFilterType)
    },
    [activity],
  )

  const handleMonitoringStatusChange = useCallback(
    (value: string) => {
      activity.setMonitorStatusFilter(value as MonitoringStatusFilter)
    },
    [activity],
  )

  const lastRefreshLabel = activity.lastRefreshAt
    ? formatDateTime(activity.lastRefreshAt)
    : "Ainda nao sincronizado"

  const greeting = useMemo(() => getGreeting(), [])

  if (loadingSession) {
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
      {notifications.successMessage && (
        <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center">
          {notifications.successMessage}
        </div>
      )}
      {notifications.errorMessage && (
        <div className="fixed top-16 left-4 right-4 md:left-auto md:right-4 md:w-auto z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg text-sm text-center">
          {notifications.errorMessage}
        </div>
      )}

      <AdminHeader
        currentUser={currentUser}
        tabs={ADMIN_TABS}
        activeTab={activeTab}
        loggingOut={loggingOut}
        onTabChange={setActiveTab}
        onGoCalculators={handleGoToCalculators}
        onLogout={logout}
      />

      <main className="px-3 md:px-6 py-4 md:py-6 max-w-7xl mx-auto">
        {activeTab === "dashboard" && (
          <DashboardTab
            greeting={greeting}
            currentUser={currentUser}
            lastRefreshLabel={lastRefreshLabel}
            refreshingOverview={activity.refreshingOverview}
            totalUsuarios={users.totals.totalUsuarios}
            totalFuncionarios={users.totals.totalFuncionarios}
            totalAdmins={users.totals.totalAdmins}
            stats={activity.stats}
            overviewLogs={activity.overviewLogs}
            onRefreshOverview={() => void handleRefreshOverview()}
            onShowAllLogs={handleShowAllLogs}
            onNavigateToCalculator={(href) => router.push(href)}
            onOpenLocationInMaps={openLocationInMaps}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "funcionarios" && (
          <UsersTab
            users={users.users}
            loadingUsers={users.loadingUsers}
            creatingUser={users.creatingUser}
            updatingUserId={users.updatingUserId}
            deletingUserId={users.deletingUserId}
            showCreateForm={users.showCreateForm}
            newUsername={users.newUsername}
            newPassword={users.newPassword}
            editingUserId={users.editingUserId}
            editPassword={users.editPassword}
            searchTerm={users.searchTerm}
            page={users.page}
            pagination={users.pagination}
            onToggleCreateForm={() => users.setShowCreateForm(!users.showCreateForm)}
            onCreateUser={users.handleCreateUser}
            onSetNewUsername={users.setNewUsername}
            onSetNewPassword={users.setNewPassword}
            onSetSearchTerm={users.setSearchTerm}
            onSetEditingUserId={users.setEditingUserId}
            onSetEditPassword={users.setEditPassword}
            onUpdatePassword={users.handleUpdatePassword}
            onDeleteUser={users.handleDeleteUser}
            onSetPage={users.setPage}
            formatDate={formatDate}
          />
        )}

        {activeTab === "atividades" && (
          <ActivityTab
            users={users.allUsers}
            logs={activity.activityLogs}
            loadingActivities={activity.loadingActivities}
            autoRefreshLogs={activity.autoRefreshLogs}
            filterUser={activity.filterUser}
            filterActivityType={activity.filterActivityType}
            activitySearchTerm={activity.activitySearchTerm}
            currentLogsPage={activity.currentLogsPage}
            hasPreviousLogsPage={activity.hasPreviousLogsPage}
            hasNextLogsPage={activity.hasNextLogsPage}
            onToggleAutoRefresh={() => activity.setAutoRefreshLogs(!activity.autoRefreshLogs)}
            onExportCsv={activity.exportCurrentActivities}
            onRefresh={() => void activity.refreshActivities()}
            onFilterUserChange={activity.setFilterUser}
            onFilterActivityTypeChange={handleActivityTypeChange}
            onSearchChange={activity.setActivitySearchTerm}
            onGoPrevious={() => void activity.goToPreviousLogsPage()}
            onGoNext={() => void activity.goToNextLogsPage()}
            onOpenLocationInMaps={openLocationInMaps}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "monitoramento" && (
          <MonitoringTab
            activityLogLimit={ADMIN_ACTIVITY_OVERVIEW_LIMIT}
            monitoringSummary={activity.monitoringSummary}
            monitoringCards={activity.filteredMonitoringCards}
            monitorSearchTerm={activity.monitorSearchTerm}
            monitorStatusFilter={activity.monitorStatusFilter}
            selectedUserDetails={activity.selectedUserDetails}
            loadingActivities={activity.loadingOverview}
            onMonitorSearchChange={activity.setMonitorSearchTerm}
            onMonitorStatusFilterChange={handleMonitoringStatusChange}
            onToggleUserDetails={handleToggleUserDetails}
            onRefresh={() => void activity.loadOverview({ includeStats: true })}
            onOpenLocationInMaps={openLocationInMaps}
            formatDateTime={formatDateTime}
          />
        )}

        {activeTab === "banco" && (
          <DatabaseTab
            dbStats={dbStats.dbStats}
            loadingDb={dbStats.loadingDb}
            clearingData={dbStats.clearingData}
            onRefresh={() => void dbStats.loadDbStats()}
            onClearData={(table, olderThanDays) => void dbStats.clearData(table, olderThanDays)}
          />
        )}

        {activeTab === "perfil" && (
          <ProfileTab
            currentUser={currentUser}
            newAdminPassword={newAdminPassword}
            confirmPassword={confirmPassword}
            updatingOwnPassword={updatingOwnPassword}
            onSetNewAdminPassword={setNewAdminPassword}
            onSetConfirmPassword={setConfirmPassword}
            onUpdateOwnPassword={handleUpdateOwnPassword}
          />
        )}
      </main>
    </div>
  )
}
