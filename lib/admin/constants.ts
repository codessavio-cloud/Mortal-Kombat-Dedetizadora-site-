import type { AdminTabItem } from "@/lib/admin/types"

export const ADMIN_ACTIVITY_PAGE_SIZE = 50
export const ADMIN_ACTIVITY_OVERVIEW_LIMIT = 100
export const ADMIN_AUTO_REFRESH_INTERVAL_MS = 30_000
export const ADMIN_SEARCH_DEBOUNCE_MS = 250
export const ADMIN_USERS_PAGE_SIZE = 20

export const ADMIN_TABS: AdminTabItem[] = [
  { id: "dashboard", label: "Inicio" },
  { id: "funcionarios", label: "Equipe" },
  { id: "atividades", label: "Logs" },
  { id: "monitoramento", label: "Monitor" },
  { id: "banco", label: "Banco" },
  { id: "perfil", label: "Perfil" },
]

export const ADMIN_QUICK_ACCESS_LINKS = [
  { name: "Baratinha", href: "/baratinha" },
  { name: "Barata", href: "/barata-esgoto" },
  { name: "Rato", href: "/rato" },
  { name: "Escorpiao", href: "/escorpiao" },
  { name: "Formiga", href: "/formiga" },
  { name: "Cupim", href: "/cupim" },
  { name: "Aranha", href: "/aranha-mosquito-traca" },
  { name: "Pulga", href: "/pulga-carrapato-percevejo" },
] as const
