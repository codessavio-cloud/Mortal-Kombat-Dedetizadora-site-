"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import {
  readClientSession,
  subscribeAuthEvents,
} from "@/lib/auth/client-session"

const ACTIVITY_DEDUP_WINDOW_MS = 4_000

interface TrackerEventDetail {
  details?: string
}

export function ActivityTracker() {
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const lastActivityRef = useRef<{ key: string; timestamp: number } | null>(null)

  useEffect(() => {
    if (pathname === "/login") {
      setIsAuthenticated(false)
      return
    }

    let cancelled = false

    const checkAuth = async () => {
      try {
        const snapshot = await readClientSession({ force: false })
        if (!cancelled) {
          setIsAuthenticated(snapshot.status === "authenticated")
        }
      } catch (error) {
        if (cancelled) {
          return
        }
        setIsAuthenticated(false)
        if (process.env.NODE_ENV !== "production") {
          console.warn("[activity-tracker] Falha ao validar autenticacao", error)
        }
      }
    }

    void checkAuth()

    const unsubscribe = subscribeAuthEvents((event) => {
      if (event.type === "logout") {
        setIsAuthenticated(false)
        return
      }

      if (event.type === "login" || event.type === "refresh") {
        void checkAuth()
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
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

    const handleCalculo = (event: Event) => {
      const details =
        event instanceof CustomEvent
          ? ((event.detail as TrackerEventDetail | undefined)?.details ?? "")
          : ""
      logActivity("Calculou orcamento", details, "calculo")
    }

    const handleCopia = (event: Event) => {
      const details =
        event instanceof CustomEvent
          ? ((event.detail as TrackerEventDetail | undefined)?.details ?? "")
          : ""
      logActivity("Copiou orientacoes", details, "copia")
    }

    window.addEventListener("orcamento-calculado", handleCalculo)
    window.addEventListener("orientacoes-copiadas", handleCopia)

    return () => {
      window.removeEventListener("orcamento-calculado", handleCalculo)
      window.removeEventListener("orientacoes-copiadas", handleCopia)
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
