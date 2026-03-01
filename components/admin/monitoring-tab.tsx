"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getMonitoringStatusClasses, getMonitoringStatusLabel } from "@/lib/admin/formatters"
import type { AdminMonitoringCardData, AdminMonitoringSummary, MonitoringStatusFilter } from "@/lib/admin/types"

interface MonitoringTabProps {
  activityLogLimit: number
  monitoringSummary: AdminMonitoringSummary
  monitoringCards: AdminMonitoringCardData[]
  monitorSearchTerm: string
  monitorStatusFilter: MonitoringStatusFilter
  selectedUserDetails: string | null
  loadingActivities: boolean
  onMonitorSearchChange: (value: string) => void
  onMonitorStatusFilterChange: (value: MonitoringStatusFilter) => void
  onToggleUserDetails: (username: string) => void
  onRefresh: () => void
  onOpenLocationInMaps: (lat: number, lng: number) => void
  formatDateTime: (value: string) => string
}

export function MonitoringTab({
  activityLogLimit,
  monitoringSummary,
  monitoringCards,
  monitorSearchTerm,
  monitorStatusFilter,
  selectedUserDetails,
  loadingActivities,
  onMonitorSearchChange,
  onMonitorStatusFilterChange,
  onToggleUserDetails,
  onRefresh,
  onOpenLocationInMaps,
  formatDateTime,
}: MonitoringTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Monitoramento</h2>
        <p className="text-gray-600 text-xs md:text-sm">Acompanhe cada funcionario</p>
        <p className="text-gray-500 text-xs mt-1">Dados com base nos ultimos {activityLogLimit} logs coletados.</p>
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
              onChange={(event) => onMonitorSearchChange(event.target.value)}
              placeholder="Digite o usuario..."
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <select
              value={monitorStatusFilter}
              onChange={(event) => onMonitorStatusFilterChange(event.target.value as MonitoringStatusFilter)}
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
              onClick={onRefresh}
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
        {monitoringCards.map((card) => (
          <div key={card.user.id} className="bg-white rounded-xl shadow-sm border p-3">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                  {card.user.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm">{card.user.username}</h3>
                  <p className="text-xs text-gray-500 truncate">
                    Ultima atividade: {card.lastActivity ? formatDateTime(card.lastActivity.created_at) : "Sem dados"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Ultimo login: {card.lastLogin ? formatDateTime(card.lastLogin.created_at) : "Nunca"}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-[10px] font-semibold ${getMonitoringStatusClasses(card.status)}`}>
                {getMonitoringStatusLabel(card.status)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-2">
              <div className="bg-blue-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-blue-600">{card.calculos}</p>
                <p className="text-xs text-blue-600">Calculos</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-2 text-center">
                <p className="text-lg font-bold text-purple-600">{card.copias}</p>
                <p className="text-xs text-purple-600">Copias</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-gray-700">{card.navegacoes}</p>
                <p className="text-[10px] text-gray-500">Navegacoes</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-gray-700">{card.acoesHoje}</p>
                <p className="text-[10px] text-gray-500">Hoje</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-sm font-bold text-gray-700">{card.paginasUnicas}</p>
                <p className="text-[10px] text-gray-500">Paginas</p>
              </div>
            </div>

            <p className="text-[10px] text-gray-500 mb-2">Total de acoes registradas: {card.totalAcoes}</p>

            {card.lastLocation?.latitude && card.lastLocation?.longitude && (
              <button
                onClick={() => {
                  if (!card.lastLocation?.latitude || !card.lastLocation?.longitude) {
                    return
                  }
                  onOpenLocationInMaps(card.lastLocation.latitude, card.lastLocation.longitude)
                }}
                className="w-full py-2 text-xs bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center justify-center gap-1"
              >
                Mapa Ver localizacao
              </button>
            )}

            <button
              onClick={() => onToggleUserDetails(card.user.username)}
              className="w-full mt-2 py-2 text-xs bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {selectedUserDetails === card.user.username ? "Fechar" : "Ver detalhes"}
            </button>

            {selectedUserDetails === card.user.username && (
              <div className="mt-2 pt-2 border-t max-h-32 overflow-y-auto">
                {card.userLogs.slice(0, 10).map((log) => (
                  <div key={log.id} className="text-xs py-1 border-b border-gray-100">
                    <span className="text-gray-500">{formatDateTime(log.created_at)}</span> - {log.action}
                    {log.latitude && log.longitude && (
                      <button
                        onClick={() => onOpenLocationInMaps(log.latitude!, log.longitude!)}
                        className="ml-1 text-blue-500"
                      >
                        Mapa
                      </button>
                    )}
                  </div>
                ))}
                {card.userLogs.length === 0 && (
                  <p className="text-xs text-gray-500 py-2">Sem atividades recentes.</p>
                )}
              </div>
            )}
          </div>
        ))}

        {monitoringCards.length === 0 && (
          <p className="text-gray-500 text-center py-8 col-span-full">
            Nenhuma funcionaria encontrada para os filtros atuais.
          </p>
        )}
      </div>
    </div>
  )
}
