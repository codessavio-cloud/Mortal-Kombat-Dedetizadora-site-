"use client"

import type React from "react"
import { Suspense, useMemo, useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AUTH_LOGIN_BLOCK_WINDOW_SECONDS,
  AUTH_LOGIN_MAX_ATTEMPTS,
} from "@/lib/auth/constants"
import {
  loginClientSession,
  readClientSession,
  resolvePostLoginRedirect,
  sanitizeNextPath,
} from "@/lib/auth/client-session"
import type { AuthSessionStatus } from "@/lib/auth/session-utils"
import { User, Lock, Eye, EyeOff, Shield, MapPin } from "lucide-react"

function buildLoginErrorMessage(options: {
  error: string
  code?: string
  attemptInfo?: string
  retryAfterSeconds?: number
}) {
  if (options.code === "RATE_LIMITED") {
    const seconds = options.retryAfterSeconds ?? AUTH_LOGIN_BLOCK_WINDOW_SECONDS
    return `Muitas tentativas. Aguarde ${seconds}s.`
  }

  if (options.code === "INVALID_CREDENTIALS") {
    return options.attemptInfo || "Usuario ou senha invalidos."
  }

  if (options.code === "AUTH_BACKEND_UNAVAILABLE") {
    return "Servico de autenticacao indisponivel no momento."
  }

  return options.error || "Falha no login."
}

function LoginPageContent() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [locked, setLocked] = useState(false)
  const [lockTimer, setLockTimer] = useState(0)
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [locationStatus, setLocationStatus] = useState<string>("obtendo")
  const [authStatus, setAuthStatus] = useState<AuthSessionStatus>("checking")

  const submitGuardRef = useRef(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedPath = useMemo(
    () => sanitizeNextPath(searchParams.get("next")),
    [searchParams],
  )

  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      try {
        const snapshot = await readClientSession({ force: false, status: "checking" })

        if (!snapshot.user || snapshot.status !== "authenticated" || cancelled) {
          if (!cancelled) {
            setAuthStatus("unauthenticated")
          }
          return
        }

        const redirectTo = resolvePostLoginRedirect({
          role: snapshot.user.role,
          requestedPath,
        })
        router.replace(redirectTo)
      } catch {
        if (!cancelled) {
          setAuthStatus("unauthenticated")
        }
      }
    }

    void checkSession()

    return () => {
      cancelled = true
    }
  }, [requestedPath, router])

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          setLocationStatus("obtida")
        },
        () => {
          setLocationStatus("indisponivel")
        },
        { enableHighAccuracy: true, timeout: 10000 },
      )
    } else {
      setLocationStatus("indisponivel")
    }
  }, [])

  useEffect(() => {
    if (lockTimer > 0) {
      const timer = setTimeout(() => setLockTimer(lockTimer - 1), 1000)
      return () => clearTimeout(timer)
    }

    if (locked && lockTimer === 0) {
      setLocked(false)
      setAttempts(0)
    }
  }, [lockTimer, locked])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (submitGuardRef.current || loading) {
      return
    }

    if (locked) {
      setError(`Aguarde ${lockTimer} segundos`)
      return
    }

    const normalizedUsername = username.trim()
    if (!normalizedUsername || !password) {
      setError("Preencha usuario e senha.")
      return
    }

    submitGuardRef.current = true
    setError("")
    setLoading(true)
    setAuthStatus("refreshing")

    try {
      const result = await loginClientSession({
        username: normalizedUsername,
        password,
        location,
        retries: 1,
      })

      if (!result.ok) {
        const retryAfterSeconds = result.data.retryAfterSeconds
        const remainingAttempts = result.data.remainingAttempts

        if (result.requestId && process.env.NODE_ENV !== "production") {
          console.warn("[login] Falha de autenticacao", {
            requestId: result.requestId,
            code: result.data.code,
            status: result.status,
          })
        }

        if (result.status === 429 || result.data.code === "RATE_LIMITED") {
          setLocked(true)
          setLockTimer(retryAfterSeconds ?? AUTH_LOGIN_BLOCK_WINDOW_SECONDS)
          setAttempts(AUTH_LOGIN_MAX_ATTEMPTS)
        } else if (typeof remainingAttempts === "number") {
          setAttempts(Math.max(0, AUTH_LOGIN_MAX_ATTEMPTS - remainingAttempts))
        } else if (result.data.code === "INVALID_CREDENTIALS") {
          setAttempts((current) => Math.min(AUTH_LOGIN_MAX_ATTEMPTS, current + 1))
        }

        const attemptInfo =
          typeof remainingAttempts === "number"
            ? `Usuario ou senha invalidos (${AUTH_LOGIN_MAX_ATTEMPTS - remainingAttempts}/${AUTH_LOGIN_MAX_ATTEMPTS})`
            : undefined

        setError(
          buildLoginErrorMessage({
            error: result.data.error,
            code: result.data.code,
            attemptInfo,
            retryAfterSeconds,
          }),
        )
        setPassword("")
        setAuthStatus("unauthenticated")
        return
      }

      setAttempts(0)
      setLocked(false)
      setLockTimer(0)
      setPassword("")
      setAuthStatus("authenticated")

      const redirectTo = resolvePostLoginRedirect({
        role: result.data.user.role,
        requestedPath,
        apiRedirectTo: result.data.redirectTo,
      })

      router.replace(redirectTo)
      router.refresh()
    } catch {
      setError("Erro ao conectar com o servidor.")
      setAuthStatus("unauthenticated")
    } finally {
      submitGuardRef.current = false
      setLoading(false)
    }
  }

  if (authStatus === "checking") {
    return <LoginPageLoading />
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6 sm:mb-8">
          <Image
            src="/images/image.png"
            alt="Mortal Kombat"
            width={320}
            height={96}
            priority
            loading="eager"
            className="mx-auto h-14 sm:h-20 w-auto object-contain"
          />
          <p className="text-gray-500 text-xs sm:text-sm mt-1 sm:mt-2">Sistema de Orcamentos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs sm:text-sm text-gray-600">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  required
                  disabled={locked}
                  autoComplete="username"
                  autoCapitalize="none"
                  className="h-10 sm:h-11 pl-10 text-base border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Digite seu usuario"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs sm:text-sm text-gray-600">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={locked}
                  autoComplete="current-password"
                  className="h-10 sm:h-11 pl-10 pr-10 text-base border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Digite sua senha"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-lg text-xs sm:text-sm">
                {error}
              </div>
            )}

            {attempts > 0 && !locked && (
              <div className="bg-amber-50 border border-amber-100 text-amber-600 px-3 py-2 rounded-lg text-xs sm:text-sm">
                {AUTH_LOGIN_MAX_ATTEMPTS - attempts} tentativas restantes
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || locked || authStatus === "refreshing"}
              className="w-full h-10 sm:h-11 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-lg text-sm sm:text-base"
            >
              {loading || authStatus === "refreshing"
                ? "Entrando..."
                : locked
                  ? `Bloqueado (${lockTimer}s)`
                  : "Entrar"}
            </Button>
          </form>

          <div className="mt-4 sm:mt-5 pt-3 sm:pt-4 border-t border-gray-100 flex items-center justify-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>Seguro</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${locationStatus === "obtida" ? "text-green-500" : ""}`} />
              <span>
                {locationStatus === "obtendo" && "Obtendo..."}
                {locationStatus === "obtida" && "OK"}
                {locationStatus === "indisponivel" && "N/A"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-4 sm:mt-6">Mortal Kombat Dedetizadora</p>
      </div>
    </div>
  )
}

function LoginPageLoading() {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-600">Verificando sessao...</p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageLoading />}>
      <LoginPageContent />
    </Suspense>
  )
}
