"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AUTH_LOGIN_BLOCK_WINDOW_SECONDS,
  AUTH_LOGIN_MAX_ATTEMPTS,
} from "@/lib/auth/constants"
import { User, Lock, Eye, EyeOff, Shield, MapPin } from "lucide-react"

export default function LoginPage() {
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
  const router = useRouter()

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
    } else if (locked && lockTimer === 0) {
      setLocked(false)
      setAttempts(0)
    }
  }, [lockTimer, locked])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (locked) {
      setError(`Aguarde ${lockTimer} segundos`)
      return
    }

    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          location: location ? { latitude: location.latitude, longitude: location.longitude } : null,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429) {
          setLocked(true)
          setLockTimer(AUTH_LOGIN_BLOCK_WINDOW_SECONDS)
          setError(data.error || `Muitas tentativas. Aguarde ${AUTH_LOGIN_BLOCK_WINDOW_SECONDS}s.`)
          setLoading(false)
          return
        }

        if (response.status >= 500) {
          setError(data.error || "Servico temporariamente indisponivel. Tente novamente.")
          setLoading(false)
          return
        }

        const newAttempts = attempts + 1
        setAttempts(newAttempts)

        if (newAttempts >= AUTH_LOGIN_MAX_ATTEMPTS) {
          setLocked(true)
          setLockTimer(AUTH_LOGIN_BLOCK_WINDOW_SECONDS)
          setError(`Muitas tentativas. Aguarde ${AUTH_LOGIN_BLOCK_WINDOW_SECONDS}s.`)
        } else {
          setError(data.error || `Credenciais invalidas (${newAttempts}/${AUTH_LOGIN_MAX_ATTEMPTS})`)
        }
        setLoading(false)
        return
      }

      setAttempts(0)
      router.push("/")
      router.refresh()
    } catch {
      setError("Erro ao conectar")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen min-h-[100dvh] bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-sm">
        {/* Logo - menor em mobile */}
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

        {/* Card de Login - padding reduzido em mobile */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
            {/* Campo Usuario */}
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
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={locked}
                  autoComplete="username"
                  autoCapitalize="none"
                  className="h-10 sm:h-11 pl-10 text-base border-gray-200 focus:border-red-500 focus:ring-red-500"
                  placeholder="Digite seu usuario"
                />
              </div>
            </div>

            {/* Campo Senha */}
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
                  onChange={(e) => setPassword(e.target.value)}
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

            {/* Mensagens - texto menor em mobile */}
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

            {/* Botao Entrar */}
            <Button
              type="submit"
              disabled={loading || locked}
              className="w-full h-10 sm:h-11 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-medium rounded-lg text-sm sm:text-base"
            >
              {loading ? "Entrando..." : locked ? `Bloqueado (${lockTimer}s)` : "Entrar"}
            </Button>
          </form>

          {/* Status - compacto em mobile */}
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

        {/* Copyright */}
        <p className="text-center text-gray-400 text-[10px] sm:text-xs mt-4 sm:mt-6">Mortal Kombat Dedetizadora</p>
      </div>
    </div>
  )
}
