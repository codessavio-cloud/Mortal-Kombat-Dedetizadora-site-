"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { usePathname } from "next/navigation"

const AUTH_STATUS_TTL_MS = 60_000
const ACTIVITY_DEDUP_WINDOW_MS = 4_000

export function ActivityTracker() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const authCheckedAtRef = useRef(0)
  const authRequestControllerRef = useRef<AbortController | null>(null)
  const lastActivityRef = useRef<{ key: string; timestamp: number } | null>(null)

  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthenticated(false)
      authCheckedAtRef.current = 0
      authRequestControllerRef.current?.abort()
      authRequestControllerRef.current = null
      return
    }

    const now = Date.now()
    if (now - authCheckedAtRef.current < AUTH_STATUS_TTL_MS) {
      return
    }

    const checkAuth = async () => {
      authRequestControllerRef.current?.abort()
      const controller = new AbortController()
      authRequestControllerRef.current = controller

      try {
        const res = await fetch("/api/auth/me", {
          cache: "no-store",
          signal: controller.signal,
        })
        setIsAuthenticated(res.ok)
        authCheckedAtRef.current = Date.now()
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }
        setIsAuthenticated(false)
        authCheckedAtRef.current = Date.now()
        if (process.env.NODE_ENV !== "production") {
          console.warn("[activity-tracker] Falha ao validar autenticacao", error)
        }
      } finally {
        if (authRequestControllerRef.current === controller) {
          authRequestControllerRef.current = null
        }
      }
    }

    void checkAuth()

    return () => {
      authRequestControllerRef.current?.abort()
      authRequestControllerRef.current = null
    }
  }, [pathname])

  const logActivity = useCallback(
    (action: string, details: string, type: string) => {
      if (!isAuthenticated || pathname === "/login") return

      const dedupeKey = `${pathname}|${action}|${details}|${type}`
      const now = Date.now()
      const lastActivity = lastActivityRef.current
      if (
        lastActivity &&
        lastActivity.key === dedupeKey &&
        now - lastActivity.timestamp < ACTIVITY_DEDUP_WINDOW_MS
      ) {
        return
      }
      lastActivityRef.current = { key: dedupeKey, timestamp: now }

      const payload = {
        action,
        details,
        page: pathname,
        type,
      }

      try {
        if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
          const blob = new Blob([JSON.stringify(payload)], {
            type: "application/json",
          })
          const sent = navigator.sendBeacon("/api/activity", blob)
          if (sent) {
            return
          }
        }

        void fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        })
      } catch (error) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[activity-tracker] Falha ao enviar log de atividade", error)
        }
      }
    },
    [pathname, isAuthenticated],
  )

  useEffect(() => {
    if (!isAuthenticated || pathname === "/login") return

    const pageName = getPageName(pathname)
    logActivity(`Acessou ${pageName}`, `Navegou para ${pathname}`, "navegacao")
  }, [pathname, logActivity, isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated || pathname === "/login") return

    const handleCalculo = (e: CustomEvent) => {
      logActivity("Calculou orcamento", e.detail?.details || "", "calculo")
    }

    const handleCopia = (e: CustomEvent) => {
      logActivity("Copiou orientacoes", e.detail?.details || "", "copia")
    }

    window.addEventListener("orcamento-calculado" as any, handleCalculo)
    window.addEventListener("orientacoes-copiadas" as any, handleCopia)

    return () => {
      window.removeEventListener("orcamento-calculado" as any, handleCalculo)
      window.removeEventListener("orientacoes-copiadas" as any, handleCopia)
    }
  }, [logActivity, isAuthenticated, pathname])

  return null
}

function getPageName(pathname: string): string {
  const pageNames: Record<string, string> = {
    "/": "Pagina Inicial",
    "/login": "Login",
    "/admin": "Dashboard Admin",
    "/baratinha": "Calculadora Baratinha",
    "/barata-esgoto": "Calculadora Barata de Esgoto",
    "/rato": "Calculadora Rato",
    "/escorpiao": "Calculadora Escorpiao",
    "/formiga": "Calculadora Formiga",
    "/cupim": "Calculadora Cupim",
    "/aranha-mosquito-traca": "Calculadora Aranha/Mosquito",
    "/pulga-carrapato-percevejo": "Calculadora Pulga/Carrapato",
    "/escorpiao-formiga": "Calculadora Combo",
    "/caixa-dagua": "Caixa d'Agua",
    "/veiculos": "Veiculos",
    "/atomizacao": "Atomizacao",
    "/falas": "Falas",
  }
  return pageNames[pathname] || pathname
}
