"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { logoutClientSession } from "@/lib/auth/client-session"

interface SignOutButtonProps {
  className: string
  idleLabel?: string
  loadingLabel?: string
}

export function SignOutButton({
  className,
  idleLabel = "Sair",
  loadingLabel = "Saindo...",
}: SignOutButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    if (loading) {
      return
    }

    setLoading(true)
    try {
      await logoutClientSession()
    } finally {
      router.replace("/login")
      router.refresh()
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className={className}
    >
      {loading ? loadingLabel : idleLabel}
    </button>
  )
}
