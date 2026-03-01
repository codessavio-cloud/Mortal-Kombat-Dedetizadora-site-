"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdminUser, AdminUsersPagination } from "@/lib/admin/types"

interface UsersTabProps {
  users: AdminUser[]
  loadingUsers: boolean
  creatingUser: boolean
  updatingUserId: string | null
  deletingUserId: string | null
  showCreateForm: boolean
  newUsername: string
  newPassword: string
  editingUserId: string | null
  editPassword: string
  searchTerm: string
  page: number
  pagination: AdminUsersPagination
  onToggleCreateForm: () => void
  onCreateUser: (event: React.FormEvent) => Promise<void>
  onSetNewUsername: (value: string) => void
  onSetNewPassword: (value: string) => void
  onSetSearchTerm: (value: string) => void
  onSetEditingUserId: (value: string | null) => void
  onSetEditPassword: (value: string) => void
  onUpdatePassword: (userId: string) => Promise<void>
  onDeleteUser: (userId: string, username: string) => Promise<void>
  onSetPage: (page: number) => void
  formatDate: (value: string) => string
}

export function UsersTab({
  users,
  loadingUsers,
  creatingUser,
  updatingUserId,
  deletingUserId,
  showCreateForm,
  newUsername,
  newPassword,
  editingUserId,
  editPassword,
  searchTerm,
  page,
  pagination,
  onToggleCreateForm,
  onCreateUser,
  onSetNewUsername,
  onSetNewPassword,
  onSetSearchTerm,
  onSetEditingUserId,
  onSetEditPassword,
  onUpdatePassword,
  onDeleteUser,
  onSetPage,
  formatDate,
}: UsersTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-gray-900">Equipe</h2>
          <p className="text-gray-600 text-xs md:text-sm">Gerencie funcionarios</p>
        </div>

        <Button
          onClick={onToggleCreateForm}
          className="bg-red-600 hover:bg-red-700 text-white text-xs w-full sm:w-auto"
          size="sm"
          disabled={creatingUser}
        >
          {showCreateForm ? "Cancelar" : "+ Novo"}
        </Button>
      </div>

      {showCreateForm && (
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Novo Funcionario</h3>
          <form onSubmit={onCreateUser} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="newUsername" className="text-xs">
                  Usuario
                </Label>
                <Input
                  id="newUsername"
                  value={newUsername}
                  onChange={(event) => onSetNewUsername(event.target.value)}
                  disabled={creatingUser}
                  required
                  placeholder="Ex: JoaoMk"
                  className="mt-1 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="newPassword" className="text-xs">
                  Senha
                </Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(event) => onSetNewPassword(event.target.value)}
                  disabled={creatingUser}
                  required
                  placeholder="Min 6 caracteres"
                  className="mt-1 text-sm"
                />
              </div>
            </div>
            <Button type="submit" disabled={creatingUser} className="bg-red-600 hover:bg-red-700 w-full text-sm">
              {creatingUser ? "Criando..." : "Criar Funcionario"}
            </Button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border p-3">
        <Input
          placeholder="Buscar..."
          value={searchTerm}
          onChange={(event) => onSetSearchTerm(event.target.value)}
          className="text-sm"
        />
      </div>

      {loadingUsers && (
        <div className="bg-white rounded-xl border p-4 text-xs text-gray-500">Carregando usuarios...</div>
      )}

      <div className="space-y-2 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="bg-white rounded-xl shadow-sm border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                    user.role === "admin" ? "bg-red-600" : "bg-gray-500"
                  }`}
                >
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-sm">{user.username}</p>
                  <p className="text-xs text-gray-500">{user.role === "admin" ? "Admin" : "Funcionario"}</p>
                </div>
              </div>

              {user.role !== "admin" && (
                <div className="flex gap-1">
                  {editingUserId === user.id ? (
                    <div className="flex gap-1">
                      <Input
                        type="password"
                        value={editPassword}
                        onChange={(event) => onSetEditPassword(event.target.value)}
                        placeholder="Nova senha"
                        disabled={updatingUserId === user.id}
                        className="w-24 h-7 text-xs"
                      />
                      <Button
                        size="sm"
                        onClick={() => void onUpdatePassword(user.id)}
                        disabled={updatingUserId === user.id}
                        className="bg-green-600 h-7 text-xs px-2"
                      >
                        {updatingUserId === user.id ? "..." : "OK"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetEditingUserId(null)}
                        disabled={updatingUserId === user.id}
                        className="h-7 text-xs px-2"
                      >
                        X
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSetEditingUserId(user.id)}
                        className="h-7 text-xs px-2"
                      >
                        Senha
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 border-red-200 h-7 text-xs px-2 bg-transparent"
                        onClick={() => void onDeleteUser(user.id, user.username)}
                        disabled={deletingUserId === user.id}
                      >
                        {deletingUserId === user.id ? "..." : "X"}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {!loadingUsers && users.length === 0 && (
          <p className="text-gray-500 text-center py-6 text-sm bg-white rounded-xl shadow-sm border">
            Nenhum usuario encontrado para o filtro informado.
          </p>
        )}
      </div>

      <div className="hidden md:block bg-white rounded-xl shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Usuario</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Cargo</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-900">Criado em</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-900">Acoes</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-white font-bold text-xs ${
                        user.role === "admin" ? "bg-red-600" : "bg-gray-500"
                      }`}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{user.username}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {user.role === "admin" ? "Admin" : "Funcionario"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{formatDate(user.created_at)}</td>
                <td className="px-4 py-3 text-right">
                  {user.role !== "admin" && (
                    <div className="flex items-center justify-end gap-2">
                      {editingUserId === user.id ? (
                        <>
                          <Input
                            type="password"
                            value={editPassword}
                            onChange={(event) => onSetEditPassword(event.target.value)}
                            placeholder="Nova senha"
                            disabled={updatingUserId === user.id}
                            className="w-28 h-7 text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => void onUpdatePassword(user.id)}
                            disabled={updatingUserId === user.id}
                            className="bg-green-600 hover:bg-green-700 h-7 text-xs"
                          >
                            {updatingUserId === user.id ? "Salvando..." : "Salvar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSetEditingUserId(null)}
                            disabled={updatingUserId === user.id}
                            className="h-7 text-xs"
                          >
                            Cancelar
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onSetEditingUserId(user.id)}
                            className="h-7 text-xs"
                          >
                            Alterar Senha
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 bg-transparent h-7 text-xs"
                            onClick={() => void onDeleteUser(user.id, user.username)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id ? "Excluindo..." : "Excluir"}
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!loadingUsers && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-sm text-gray-500">
                  Nenhum usuario encontrado para o filtro informado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between">
        <p className="text-xs text-gray-600">
          Pagina {pagination.page} de {pagination.totalPages}
        </p>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onSetPage(Math.max(1, page - 1))}
            disabled={!pagination.hasPrevPage}
          >
            Anterior
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs"
            onClick={() => onSetPage(page + 1)}
            disabled={!pagination.hasNextPage}
          >
            Proxima
          </Button>
        </div>
      </div>
    </div>
  )
}
