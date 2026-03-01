"use client"

import Image from "next/image"

import { Button } from "@/components/ui/button"
import { AdminTabs } from "@/components/admin/admin-tabs"
import type { AdminCurrentUser, AdminTabItem, AdminTabType } from "@/lib/admin/types"

interface AdminHeaderProps {
  currentUser: AdminCurrentUser | null
  tabs: AdminTabItem[]
  activeTab: AdminTabType
  loggingOut: boolean
  onTabChange: (tab: AdminTabType) => void
  onGoCalculators: () => void
  onLogout: () => void
}

export function AdminHeader({
  currentUser,
  tabs,
  activeTab,
  loggingOut,
  onTabChange,
  onGoCalculators,
  onLogout,
}: AdminHeaderProps) {
  return (
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
              onClick={onGoCalculators}
              size="sm"
              variant="outline"
              className="hidden md:flex text-xs px-2"
            >
              Calculadoras
            </Button>
            <Button
              onClick={onLogout}
              size="sm"
              variant="outline"
              disabled={loggingOut}
              className="border-red-600 text-red-600 hover:bg-red-50 bg-transparent text-xs px-2"
            >
              {loggingOut ? "Saindo..." : "Sair"}
            </Button>
          </div>
        </div>
      </div>

      <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
    </header>
  )
}
