"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminActivityFilterType, AdminActivityLog, AdminUser } from "@/lib/admin/types"

interface ActivityTabProps {
  users: AdminUser[]
  logs: AdminActivityLog[]
  loadingActivities: boolean
  autoRefreshLogs: boolean
  filterUser: string
  filterActivityType: AdminActivityFilterType
  activitySearchTerm: string
  currentLogsPage: number
  hasPreviousLogsPage: boolean
  hasNextLogsPage: boolean
  onToggleAutoRefresh: () => void
  onExportCsv: () => void
  onRefresh: () => void
  onFilterUserChange: (value: string) => void
  onFilterActivityTypeChange: (value: AdminActivityFilterType) => void
  onSearchChange: (value: string) => void
  onGoPrevious: () => void
  onGoNext: () => void
  onOpenLocationInMaps: (lat: number, lng: number) => void
  formatDateTime: (value: string) => string
}

export function ActivityTab({
  users,
  logs,
  loadingActivities,
  autoRefreshLogs,
  filterUser,
  filterActivityType,
  activitySearchTerm,
  currentLogsPage,
  hasPreviousLogsPage,
  hasNextLogsPage,
  onToggleAutoRefresh,
  onExportCsv,
  onRefresh,
  onFilterUserChange,
  onFilterActivityTypeChange,
  onSearchChange,
  onGoPrevious,
  onGoNext,
  onOpenLocationInMaps,
  formatDateTime,
}: ActivityTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Logs de Atividades</h2>
          <p className="text-gray-600 text-xs md:text-sm">{logs.length} logs no lote atual</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={onToggleAutoRefresh}
            variant="outline"
            size="sm"
            className="text-xs bg-transparent flex-1 sm:flex-none"
          >
            {autoRefreshLogs ? "Auto: ON" : "Auto: OFF"}
          </Button>
          <Button
            onClick={onExportCsv}
            variant="outline"
            size="sm"
            className="text-xs bg-transparent flex-1 sm:flex-none"
          >
            Exportar CSV
          </Button>
          <Button
            onClick={onRefresh}
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
              onChange={(event) => onFilterUserChange(event.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="todos">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.username}>
                  {user.username}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Tipo de acao</Label>
            <select
              value={filterActivityType}
              onChange={(event) => onFilterActivityTypeChange(event.target.value as AdminActivityFilterType)}
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
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Ex: calculou, /baratinha, login..."
              className="mt-1 text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2 md:hidden">
        {logs.map((log) => (
          <div key={log.id} className="bg-white rounded-xl shadow-sm border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{log.username}</span>
                  {log.latitude && log.longitude && (
                    <button
                      onClick={() => onOpenLocationInMaps(log.latitude!, log.longitude!)}
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
        {logs.length === 0 && (
          <p className="text-gray-500 text-center py-6 text-sm bg-white rounded-xl shadow-sm border">
            Nenhum log encontrado para o filtro selecionado.
          </p>
        )}
      </div>

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
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-xs font-medium">{log.username}</td>
                  <td className="px-3 py-2 text-xs">{log.action}</td>
                  <td className="px-3 py-2 text-xs text-gray-600 max-w-xs truncate">{log.details || "-"}</td>
                  <td className="px-3 py-2">
                    {log.latitude && log.longitude ? (
                      <button
                        onClick={() => onOpenLocationInMaps(log.latitude!, log.longitude!)}
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
              {logs.length === 0 && (
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
        <p className="text-xs text-gray-600">Pagina {currentLogsPage}</p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onGoPrevious}
            disabled={!hasPreviousLogsPage || loadingActivities}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={onGoNext}
            disabled={!hasNextLogsPage || loadingActivities}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  )
}
