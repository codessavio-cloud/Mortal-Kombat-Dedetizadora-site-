import type { AdminActivityFilterType, MonitoringStatus } from "@/lib/admin/types"

export function formatDateTime(dateString: string) {
  if (!dateString) {
    return "-"
  }

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

export function formatDate(dateString: string) {
  if (!dateString) {
    return "-"
  }

  try {
    return new Date(dateString).toLocaleDateString("pt-BR")
  } catch {
    return "-"
  }
}

export function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) {
    return "Bom dia"
  }
  if (hour < 18) {
    return "Boa tarde"
  }
  return "Boa noite"
}

export function resolveActivityType(action: string): AdminActivityFilterType {
  const normalized = action.toLowerCase()
  if (normalized === "login") return "login"
  if (normalized.includes("calculou")) return "calculo"
  if (normalized.includes("copiou")) return "copia"
  if (normalized.includes("acessou") || normalized.includes("navegou")) return "navegacao"
  if (normalized.includes("limpou")) return "limpeza"
  return "usuario"
}

export function getMonitoringStatusClasses(status: MonitoringStatus) {
  if (status === "ativo") {
    return "bg-green-100 text-green-700"
  }
  if (status === "atencao") {
    return "bg-yellow-100 text-yellow-700"
  }
  return "bg-gray-100 text-gray-700"
}

export function getMonitoringStatusLabel(status: MonitoringStatus) {
  if (status === "ativo") {
    return "Ativo"
  }
  if (status === "atencao") {
    return "Atencao"
  }
  return "Inativo"
}
