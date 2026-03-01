export interface AdminUser {
  id: string
  username: string
  role: "admin" | "funcionario"
  created_at: string
  ultimo_login?: string
  ativo?: boolean
  nome_completo?: string | null
}

export interface AdminCurrentUser {
  id: string
  username: string
  role: "admin" | "funcionario"
}

export interface AdminActivityLog {
  id: string
  user_id: string | null
  username: string
  action: string
  details: string | null
  page: string | null
  created_at: string
  latitude: number | null
  longitude: number | null
}

export interface AdminStats {
  totalLogs: number
  todayLogs: number
  loginCount: number
  calculoCount: number
  copiaCount: number
  navegacaoCount: number
}

export interface AdminDbStats {
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

export type MonitoringStatus = "ativo" | "atencao" | "inativo"
export type MonitoringStatusFilter = "todos" | MonitoringStatus
export type AdminMonitoringStatusFilter = MonitoringStatusFilter

export interface AdminMonitoringCardData {
  user: AdminUser
  userLogs: AdminActivityLog[]
  lastLogin: AdminActivityLog | undefined
  lastActivity: AdminActivityLog | undefined
  calculos: number
  copias: number
  navegacoes: number
  acoesHoje: number
  totalAcoes: number
  paginasUnicas: number
  status: MonitoringStatus
  lastLocation: AdminActivityLog | undefined
}

export interface AdminMonitoringSummary {
  total: number
  active: number
  attention: number
  inactive: number
  withoutLogin: number
}

export type AdminTabType =
  | "dashboard"
  | "funcionarios"
  | "atividades"
  | "monitoramento"
  | "banco"
  | "perfil"

export type AdminActivityFilterType =
  | "todos"
  | "login"
  | "calculo"
  | "copia"
  | "navegacao"
  | "usuario"
  | "limpeza"

export interface ApiErrorShape {
  error: string
  code?: string
  details?: unknown
}

export interface AdminActivityResponse {
  logs: AdminActivityLog[]
  nextCursor: string | null
  stats: AdminStats | null
}

export interface AdminUsersResponse {
  users: AdminUser[]
  page?: number
  pageSize?: number
  total?: number
  totalPages?: number
  hasNextPage?: boolean
  hasPrevPage?: boolean
}

export interface AdminUsersPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

export interface AdminTabItem {
  id: AdminTabType
  label: string
}
