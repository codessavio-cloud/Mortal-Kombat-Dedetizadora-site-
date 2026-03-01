"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminCurrentUser } from "@/lib/admin/types"

interface ProfileTabProps {
  currentUser: AdminCurrentUser | null
  newAdminPassword: string
  confirmPassword: string
  updatingOwnPassword: boolean
  onSetNewAdminPassword: (value: string) => void
  onSetConfirmPassword: (value: string) => void
  onUpdateOwnPassword: () => Promise<void>
}

export function ProfileTab({
  currentUser,
  newAdminPassword,
  confirmPassword,
  updatingOwnPassword,
  onSetNewAdminPassword,
  onSetConfirmPassword,
  onUpdateOwnPassword,
}: ProfileTabProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-bold text-gray-900">Meu Perfil</h2>
        <p className="text-gray-600 text-xs md:text-sm">Gerencie sua conta</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
            {currentUser?.username?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">{currentUser?.username}</h3>
            <p className="text-sm text-red-600 font-medium">Proprietario / Admin</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="font-bold text-gray-900 text-sm mb-3">Alterar Senha</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="newAdminPassword" className="text-xs">
              Nova Senha
            </Label>
            <Input
              id="newAdminPassword"
              type="password"
              value={newAdminPassword}
              onChange={(event) => onSetNewAdminPassword(event.target.value)}
              disabled={updatingOwnPassword}
              placeholder="Minimo 6 caracteres"
              className="mt-1 text-sm"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-xs">
              Confirmar Senha
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(event) => onSetConfirmPassword(event.target.value)}
              disabled={updatingOwnPassword}
              placeholder="Repita a senha"
              className="mt-1 text-sm"
            />
          </div>
          <Button
            onClick={() => void onUpdateOwnPassword()}
            disabled={updatingOwnPassword}
            className="w-full bg-red-600 hover:bg-red-700 text-sm"
          >
            {updatingOwnPassword ? "Salvando..." : "Salvar Nova Senha"}
          </Button>
        </div>
      </div>
    </div>
  )
}
