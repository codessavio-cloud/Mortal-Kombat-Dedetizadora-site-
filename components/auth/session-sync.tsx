"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import {
  readClientSession,
  resolvePostLoginRedirect,
  subscribeAuthEvents,
} from "@/lib/auth/client-session"

export function SessionSync() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    const unsubscribe = subscribeAuthEvents((event) => {
      if (event.type === "logout") {
        if (pathname !== "/login") {
          router.replace("/login")
        }
        router.refresh()
        return
      }

      if (event.type === "login" && pathname === "/login") {
        void readClientSession({ force: true }).then((snapshot) => {
          if (!snapshot.user) {
            return
          }

          router.replace(resolvePostLoginRedirect({ role: snapshot.user.role }))
          router.refresh()
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [pathname, router])

  return null
}
