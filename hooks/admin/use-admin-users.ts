"use client"

import type React from "react"
import { useCallback, useEffect, useMemo, useState } from "react"

import { ADMIN_SEARCH_DEBOUNCE_MS, ADMIN_USERS_PAGE_SIZE } from "@/lib/admin/constants"
import type { AdminUser, AdminUsersPagination, AdminUsersResponse } from "@/lib/admin/types"
import { adminApi, getErrorMessage, isReauthError } from "@/lib/api/admin-client"
import { logoutClientSession, readClientSession } from "@/lib/auth/client-session"

interface UseAdminUsersOptions {
  enabled: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

function useDebouncedValue(value: string, waitMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), waitMs)
    return () => clearTimeout(timeout)
  }, [value, waitMs])

  return debouncedValue
}

function createDefaultPagination(): AdminUsersPagination {
  return {
    page: 1,
    pageSize: ADMIN_USERS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  }
}

export function useAdminUsers({ enabled, onError, onSuccess }: UseAdminUsersOptions) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allUsers, setAllUsers] = useState<AdminUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [editPassword, setEditPassword] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<AdminUsersPagination>(createDefaultPagination)

  const debouncedSearch = useDebouncedValue(searchTerm.trim(), ADMIN_SEARCH_DEBOUNCE_MS)

  const handleError = useCallback(
    async (error: unknown, fallback: string) => {
      if (isReauthError(error)) {
        onError("Sessao expirada. Faca login novamente.")
        await logoutClientSession()
        return
      }

      onError(getErrorMessage(error, fallback))
    },
    [onError],
  )

  const loadUsers = useCallback(async () => {
    if (!enabled) {
      return
    }

    setLoadingUsers(true)
    try {
      const session = await readClientSession({ force: true, status: "checking" })
      if (!session.user || session.status !== "authenticated") {
        onError("Sessao expirada. Faca login novamente.")
        await logoutClientSession()
        return
      }

      if (session.user.role !== "admin") {
        onError("Acesso restrito ao administrador.")
        await logoutClientSession()
        return
      }

      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(ADMIN_USERS_PAGE_SIZE),
        activeOnly: "true",
      })

      if (debouncedSearch) {
        query.set("search", debouncedSearch)
      }

      const [response, snapshot] = await Promise.all([
        adminApi.get<AdminUsersResponse>("/api/users", { query }),
        adminApi.get<AdminUsersResponse>("/api/users"),
      ])

      const nextUsers = response.users || []
      const nextAllUsers = snapshot.users || []

      setUsers(nextUsers)
      setAllUsers(nextAllUsers.length > 0 ? nextAllUsers : nextUsers)
      setPagination({
        page: response.page ?? page,
        pageSize: response.pageSize ?? ADMIN_USERS_PAGE_SIZE,
        total: response.total ?? nextAllUsers.length ?? nextUsers.length,
        totalPages:
          response.totalPages ??
          Math.max(1, Math.ceil((nextAllUsers.length || nextUsers.length) / ADMIN_USERS_PAGE_SIZE)),
        hasNextPage: response.hasNextPage ?? false,
        hasPrevPage: response.hasPrevPage ?? page > 1,
      })
    } catch (error) {
      await handleError(error, "Nao foi possivel carregar funcionarios.")
    } finally {
      setLoadingUsers(false)
    }
  }, [debouncedSearch, enabled, handleError, onError, page])

  useEffect(() => {
    if (!enabled) {
      return
    }

    void loadUsers()
  }, [enabled, loadUsers])

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch])

  const handleCreateUser = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (newPassword.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres")
        return
      }

      setCreatingUser(true)
      try {
        await adminApi.post<{ user?: AdminUser }>("/api/users", {
          username: newUsername,
          password: newPassword,
          role: "funcionario",
        })

        setNewUsername("")
        setNewPassword("")
        setShowCreateForm(false)
        if (page !== 1) {
          setPage(1)
        } else {
          await loadUsers()
        }
        onSuccess("Funcionario criado com sucesso!")
      } catch (error) {
        await handleError(error, "Nao foi possivel criar o usuario.")
      } finally {
        setCreatingUser(false)
      }
    },
    [handleError, loadUsers, newPassword, newUsername, onSuccess, page],
  )

  const handleUpdatePassword = useCallback(
    async (userId: string) => {
      if (editPassword.length < 6) {
        alert("A senha deve ter pelo menos 6 caracteres")
        return
      }

      setUpdatingUserId(userId)
      try {
        await adminApi.patch<{ success: boolean }>(`/api/users/${userId}`, {
          password: editPassword,
        })

        setEditingUserId(null)
        setEditPassword("")
        onSuccess("Senha atualizada com sucesso!")
      } catch (error) {
        await handleError(error, "Nao foi possivel atualizar a senha.")
      } finally {
        setUpdatingUserId(null)
      }
    },
    [editPassword, handleError, onSuccess],
  )

  const handleDeleteUser = useCallback(
    async (userId: string, username: string) => {
      const confirmed = confirm(
        `Tem certeza que deseja excluir ${username}? Esta acao nao pode ser desfeita.`,
      )
      if (!confirmed) {
        return
      }

      setDeletingUserId(userId)
      try {
        await adminApi.del<{ success: boolean }>(`/api/users/${userId}`)
        if (page !== 1) {
          setPage(1)
        } else {
          await loadUsers()
        }
        onSuccess("Usuario excluido com sucesso!")
      } catch (error) {
        await handleError(error, "Nao foi possivel excluir o usuario.")
      } finally {
        setDeletingUserId(null)
      }
    },
    [handleError, loadUsers, onSuccess, page],
  )

  const totals = useMemo(() => {
    const totalFuncionarios = allUsers.filter((user) => user.role === "funcionario").length
    const totalAdmins = allUsers.filter((user) => user.role === "admin").length
    return {
      totalFuncionarios,
      totalAdmins,
      totalUsuarios: allUsers.length,
    }
  }, [allUsers])

  return {
    users,
    allUsers,
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
    totals,
    setShowCreateForm,
    setNewUsername,
    setNewPassword,
    setEditingUserId,
    setEditPassword,
    setSearchTerm,
    setPage,
    loadUsers,
    handleCreateUser,
    handleUpdatePassword,
    handleDeleteUser,
  }
}
