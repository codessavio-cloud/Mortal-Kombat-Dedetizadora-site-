"use client"

import { Button } from "@/components/ui/button"
import type { AdminDbStats } from "@/lib/admin/types"

interface DatabaseTabProps {
  dbStats: AdminDbStats | null
  loadingDb: boolean
  clearingData: boolean
  onRefresh: () => void
  onClearData: (table: "activity_logs" | "orcamentos", olderThanDays?: number) => void
}

export function DatabaseTab({ dbStats, loadingDb, clearingData, onRefresh, onClearData }: DatabaseTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Banco de Dados</h2>
          <p className="text-gray-600 text-xs md:text-sm">Monitore o armazenamento</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          disabled={loadingDb}
          size="sm"
          className="text-xs bg-transparent"
        >
          {loadingDb ? "Atualizando..." : "Atualizar"}
        </Button>
      </div>

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

      <div className="bg-white rounded-xl p-4 shadow-sm border">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Limpeza de Dados</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClearData("activity_logs", 30)}
            disabled={clearingData}
            className="text-xs"
          >
            Logs +30 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClearData("activity_logs", 7)}
            disabled={clearingData}
            className="text-xs"
          >
            Logs +7 dias
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClearData("activity_logs")}
            disabled={clearingData}
            className="text-xs text-orange-600 border-orange-200"
          >
            Todos Logs
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onClearData("orcamentos")}
            disabled={clearingData}
            className="text-xs text-red-600 border-red-200"
          >
            Orcamentos
          </Button>
        </div>
      </div>
    </div>
  )
}
