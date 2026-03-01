"use client"

import { Button } from "@/components/ui/button"
import { ADMIN_QUICK_ACCESS_LINKS } from "@/lib/admin/constants"
import type { AdminActivityLog, AdminCurrentUser, AdminStats } from "@/lib/admin/types"

interface DashboardTabProps {
  greeting: string
  currentUser: AdminCurrentUser | null
  lastRefreshLabel: string
  refreshingOverview: boolean
  totalUsuarios: number
  totalFuncionarios: number
  totalAdmins: number
  stats: AdminStats
  overviewLogs: AdminActivityLog[]
  onRefreshOverview: () => void
  onShowAllLogs: () => void
  onNavigateToCalculator: (href: string) => void
  onOpenLocationInMaps: (lat: number, lng: number) => void
  formatDateTime: (value: string) => string
}

export function DashboardTab({
  greeting,
  currentUser,
  lastRefreshLabel,
  refreshingOverview,
  totalUsuarios,
  totalFuncionarios,
  totalAdmins,
  stats,
  overviewLogs,
  onRefreshOverview,
  onShowAllLogs,
  onNavigateToCalculator,
  onOpenLocationInMaps,
  formatDateTime,
}: DashboardTabProps) {
  return (
    <div className="space-y-4">
      <div className="bg-red-600 rounded-xl p-4 md:p-6 text-white">
        <h2 className="text-lg md:text-2xl font-bold">
          {greeting}, {currentUser?.username}!
        </h2>
        <p className="text-red-100 text-sm">Painel de controle</p>
        <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <p className="text-red-100 text-xs">Ultima atualizacao: {lastRefreshLabel}</p>
          <Button
            onClick={onRefreshOverview}
            size="sm"
            disabled={refreshingOverview}
            className="bg-white text-red-600 hover:bg-red-50 text-xs w-full sm:w-auto"
          >
            {refreshingOverview ? "Atualizando..." : "Atualizar painel"}
          </Button>
        </div>
      </div>

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
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.todayLogs || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-3 md:p-4 shadow-sm border col-span-2 md:col-span-1">
          <p className="text-xs text-gray-500">Orcamentos</p>
          <p className="text-xl md:text-2xl font-bold text-gray-900">{stats.calculoCount || 0}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm md:text-base font-bold text-gray-900">Atividades Recentes</h3>
            <button onClick={onShowAllLogs} className="text-xs text-red-600 font-medium">
              Ver todas
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {overviewLogs.slice(0, 8).map((log) => (
              <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 text-xs">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{log.username}</span>
                    {log.latitude && log.longitude && (
                      <button
                        onClick={() => onOpenLocationInMaps(log.latitude!, log.longitude!)}
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

            {overviewLogs.length === 0 && (
              <p className="text-gray-500 text-center py-4 text-sm">Nenhuma atividade registrada</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="text-sm md:text-base font-bold text-gray-900 mb-3">Acesso Rapido</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {ADMIN_QUICK_ACCESS_LINKS.map((item) => (
              <button
                key={item.href}
                onClick={() => onNavigateToCalculator(item.href)}
                className="p-2 md:p-3 text-xs rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors text-center font-medium active:scale-95"
              >
                {item.name}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
