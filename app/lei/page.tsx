"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { trackGuidanceCopied } from "@/lib/activity/client"

export default function LeiPage() {
  const [copied, setCopied] = useState(false)

  const leiText = `📢 ATENÇÃO: NOVA LEI DE DEDETIZAÇÃO MENSAL

Entrou em vigor a Lei nº 25.154/2025, que determina a realização de dedetização mensal em diversos setores:

🏢 Condomínios
🏭 Indústrias
🛒 Supermercados
🏥 Hospitais
🍽️ Restaurantes
… e muito mais.

👉 Não se trata de uma escolha — é uma exigência legal.

🔗 Acesse o texto completo da lei:
https://www.almg.gov.br/legislacao-mineira/texto/LEI/25154/2025/`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(leiText)
    trackGuidanceCopied("Copiou texto da lei")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Voltar</span>
          </Link>
          <Image src="/logo.png" alt="Mortal Kombat" width={200} height={50} className="h-12 w-auto" priority />
          <div className="w-20" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-8">
            <div className="flex items-start gap-6 mb-8">
              <div className="flex-shrink-0 w-24 h-24 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-6xl">
                ⚖️
              </div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-gray-900 mb-2">Lei 25.154/2025</h1>
                <p className="text-xl text-gray-600">Dedetização Mensal Obrigatória</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-8 border-2 border-amber-200">
              <h2 className="text-2xl font-bold text-amber-900 mb-4">📢 ATENÇÃO: NOVA LEI DE DEDETIZAÇÃO MENSAL</h2>

              <p className="text-lg text-gray-800 mb-4">
                Entrou em vigor a <strong>Lei nº 25.154/2025</strong>, que determina a realização de dedetização mensal
                em diversos setores:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">🏢</span>
                  <span className="font-medium text-gray-800">Condomínios</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">🏭</span>
                  <span className="font-medium text-gray-800">Indústrias</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">🛒</span>
                  <span className="font-medium text-gray-800">Supermercados</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">🏥</span>
                  <span className="font-medium text-gray-800">Hospitais</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">🍽️</span>
                  <span className="font-medium text-gray-800">Restaurantes</span>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3 shadow-sm">
                  <span className="text-2xl">➕</span>
                  <span className="font-medium text-gray-800">E muito mais</span>
                </div>
              </div>

              <div className="bg-amber-100 border-2 border-amber-400 rounded-xl p-4 mb-6">
                <p className="text-lg font-bold text-amber-900 flex items-center gap-2">
                  <span className="text-2xl">👉</span>
                  Não se trata de uma escolha — é uma exigência legal.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <a
                  href="https://www.almg.gov.br/legislacao-mineira/texto/LEI/25154/2025/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  🔗 Acesse o texto completo da lei
                </a>
                <Button
                  onClick={handleCopy}
                  variant={copied ? "default" : "outline"}
                  size="lg"
                  className="flex-1 h-auto py-4"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 mr-2" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5 mr-2" />
                      Copiar Texto
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">💡 Informações Importantes</h3>
            <ul className="space-y-2 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>A lei estabelece obrigatoriedade de dedetização mensal para diversos estabelecimentos</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>O não cumprimento pode resultar em penalidades e multas</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Mantenha os comprovantes de serviço para fiscalização</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 font-bold">•</span>
                <span>Consulte um profissional para adequação do seu estabelecimento</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  )
}
