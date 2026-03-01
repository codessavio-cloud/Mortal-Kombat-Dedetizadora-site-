"use client"

import type { AdminTabItem, AdminTabType } from "@/lib/admin/types"

interface AdminTabsProps {
  tabs: AdminTabItem[]
  activeTab: AdminTabType
  onTabChange: (tab: AdminTabType) => void
}

export function AdminTabs({ tabs, activeTab, onTabChange }: AdminTabsProps) {
  return (
    <div className="border-t border-gray-200 overflow-x-auto">
      <nav className="flex px-2 md:px-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-3 md:px-4 py-2.5 text-xs md:text-sm font-medium border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? "border-red-600 text-red-600" : "border-transparent text-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
