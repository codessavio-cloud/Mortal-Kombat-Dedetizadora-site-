import Link from "next/link"
import Image from "next/image"
import { pestData } from "@/lib/pest-data"
import { cookies } from "next/headers"
import { verifyAuthToken, type AuthTokenPayload } from "@/lib/auth/jwt"
import { AUTH_COOKIE_NAME } from "@/lib/auth/constants"
import { Droplets, Car, TreePalm, MessageCircle } from "lucide-react"
import { SignOutButton } from "@/components/auth/signout-button"

async function getCurrentUser() {
  const cookieStore = await cookies()
  const token = cookieStore.get(AUTH_COOKIE_NAME)

  if (!token) return null

  const payload = await verifyAuthToken(token.value)
  return payload
}

const extraPages = [
  { id: "caixa-dagua", name: "Caixa d'Agua", icon: Droplets, color: "blue" },
  { id: "veiculos", name: "Veiculos", icon: Car, color: "green" },
  { id: "atomizacao", name: "Atomizacao", icon: TreePalm, color: "emerald" },
  { id: "falas", name: "Falas", icon: MessageCircle, color: "indigo" },
]

export default async function HomePage() {
  const user = (await getCurrentUser()) as AuthTokenPayload | null

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 relative"
      style={{
        backgroundImage: "url(/logo.png)",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "50%",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="absolute inset-0 bg-white/80 backdrop-blur-[2px]" />

      <div className="relative z-10">
        <header className="bg-white/90 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <Image src="/logo.png" alt="Logo" width={120} height={30} className="h-6 sm:h-8 w-auto flex-shrink-0" />
                <div className="hidden sm:block">
                  <h1 className="text-lg sm:text-xl font-bold text-gray-900">Mortal Kombat</h1>
                  <p className="text-xs text-gray-600">Controle de Pragas</p>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="text-right hidden xs:block">
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate max-w-[80px] sm:max-w-none">
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-600">{user.role === "admin" ? "Admin" : "Func."}</p>
                  </div>

                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="bg-red-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-red-700 transition-all text-xs sm:text-sm whitespace-nowrap"
                    >
                      <span className="hidden sm:inline">Dashboard Admin</span>
                      <span className="sm:hidden">Admin</span>
                    </Link>
                  )}

                  <SignOutButton
                    className="bg-gray-200 text-gray-700 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all text-xs sm:text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <div className="text-center mb-4 sm:mb-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-2 sm:mb-3">Selecione a Praga</h1>
            <p className="text-sm sm:text-lg text-gray-600 max-w-2xl mx-auto px-2">
              Escolha o tipo de praga e calcule o valor do tratamento
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-4 max-w-7xl mx-auto mb-6 sm:mb-12">
            {Object.values(pestData).map((pest) => (
              <Link key={pest.id} href={`/${pest.id}`} prefetch={false} className="group">
                <article
                  className={`rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-2 sm:p-4 flex flex-col items-center cursor-pointer border-2 active:scale-95 sm:group-hover:scale-105 ${
                    pest.isSpecial
                      ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400"
                      : "bg-white border-gray-100 hover:border-red-400"
                  }`}
                >
                  <div
                    className={`w-14 h-14 sm:w-24 sm:h-24 rounded-lg sm:rounded-xl overflow-hidden mb-2 sm:mb-3 flex items-center justify-center p-1 ${
                      pest.isSpecial
                        ? "bg-gradient-to-br from-amber-100 to-orange-100"
                        : "bg-gradient-to-br from-red-50 to-orange-50"
                    }`}
                  >
                    {pest.isSpecial ? (
                      <div className="text-3xl sm:text-5xl">LEI</div>
                    ) : (
                      <Image
                        src={pest.image || "/placeholder.svg"}
                        alt={pest.name}
                        width={96}
                        height={96}
                        sizes="(max-width: 640px) 56px, 96px"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    )}
                  </div>
                  <h2
                    className={`text-xs sm:text-sm font-bold text-center leading-tight ${
                      pest.isSpecial ? "text-amber-900" : "text-gray-900 group-hover:text-red-600"
                    } transition-colors`}
                  >
                    {pest.name}
                  </h2>
                </article>
              </Link>
            ))}
          </div>

          <div className="max-w-7xl mx-auto">
            <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-6 text-center">Outros Servicos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {extraPages.map((page) => {
                const Icon = page.icon
                return (
                  <Link key={page.id} href={`/${page.id}`} prefetch={false} className="group">
                    <article className="rounded-lg sm:rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-3 sm:p-6 flex flex-col items-center cursor-pointer border-2 bg-white border-gray-100 hover:border-red-400 active:scale-95 sm:group-hover:scale-105">
                      <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-lg sm:rounded-xl mb-2 sm:mb-4 flex items-center justify-center bg-gray-100">
                        <Icon className="w-5 h-5 sm:w-8 sm:h-8 text-gray-600" />
                      </div>
                      <h3 className="text-xs sm:text-lg font-bold text-gray-900 group-hover:text-red-600 transition-colors text-center leading-tight">
                        {page.name}
                      </h3>
                    </article>
                  </Link>
                )
              })}
            </div>
          </div>
        </main>

        <footer className="bg-gray-900 text-white mt-12 sm:mt-24 py-6 sm:py-12">
          <div className="container mx-auto px-3 sm:px-4">
            <div className="flex flex-col items-center justify-center mb-4 sm:mb-6">
              <Image
                src="/logo.png"
                alt="Mortal Kombat Controle de Pragas"
                width={300}
                height={75}
                className="h-10 sm:h-16 w-auto opacity-90 mb-2 sm:mb-4"
              />
              <p className="text-gray-400 text-center text-xs sm:text-base max-w-2xl">
                Controle profissional de pragas com garantia
              </p>
            </div>
            <div className="border-t border-gray-700 pt-4 sm:pt-6 mt-4 sm:mt-6 text-center">
              <p className="text-gray-400 text-xs sm:text-sm">(c) 2025 Mortal Kombat - Sistema de Orcamentos</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
