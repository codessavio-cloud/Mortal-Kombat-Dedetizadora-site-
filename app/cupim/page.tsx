"use client"

import { useState } from "react"
import { Copy, Check, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { trackGuidanceCopied } from "@/lib/activity/client"
import { formatBRL } from "@/lib/calculators/price-adjustment"
import {
  GARANTIA_CUPIM,
  PRECO_CUPIM_SOFA,
  PRECOS_CUPIM_GUARDA_ROUPAS,
  PRECOS_CUPIM_PORTAS,
  VALOR_APROXIMADO_CUPIM_SUBTERRANEO,
} from "@/lib/static-service-pricing"

export default function CupimPage() {
  const [copied, setCopied] = useState(false)

  const infoTexto = `CUPIM - Tabela de Preços

PORTAS:
${PRECOS_CUPIM_PORTAS.map(
  (preco) =>
    `• ${preco.label} - 1 funcionário - ${preco.tempo} - ${formatBRL(preco.cartao)} no cartão ou ${formatBRL(preco.vista)} à vista`,
).join("\n")}

SOFÁ:
• ${PRECO_CUPIM_SOFA.descricao} - ${formatBRL(PRECO_CUPIM_SOFA.valor)} - ${PRECO_CUPIM_SOFA.tempo} - ${PRECO_CUPIM_SOFA.funcionarios}

GUARDA-ROUPAS:
${PRECOS_CUPIM_GUARDA_ROUPAS.map(
  (preco) =>
    `• ${preco.label} - ${formatBRL(preco.cartao)} no cartão ou ${formatBRL(preco.vista)} à vista - ${preco.tempo} - 1 funcionário`,
).join("\n")}

${GARANTIA_CUPIM}

CUPIM DE MADEIRA:
Injeção pontual no móvel ou porta onde há foco de cupim. O cômodo deve ficar isolado por 24 horas.

Observação:
1- Caso o verniz ou pintura esteja velho ou não foi aplicado corretamente no material, corre o risco de aparecer manchas devido a aplicação.
2- Em alguns casos portas ou moveis estão com um grau de degradação muito grande, após feito o tratamento podem inchar muito e vir a perder o item a ponto de precisar substituir. Não nós responsabilizamos pelo reparo das peças.

CUPIM SUBTERRÂNEO:
O tratamento para descupinização de cupim de solo, é feito em volta do terreno furos com a distância de 30 cm e profundidade entre 30 a 40 cm, e injetado 1 litro de produto em cada furo, fazendo assim uma barreira química em baixo do solo. Essa descupinização fica em torno de ${formatBRL(VALOR_APROXIMADO_CUPIM_SUBTERRANEO)} em terreno de até 250 metros.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Cupim")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 md:py-4 flex-shrink-0">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              Voltar
            </Link>
            <Image src="/logo.png" alt="Mortal Kombat" width={150} height={40} className="h-8 md:h-12 w-auto" />
            <div className="w-16 md:w-20" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 max-w-7xl mx-auto">
            <section className="bg-white rounded-xl md:rounded-2xl p-4 md:p-8 border-2 border-gray-200 shadow-lg">
              <div className="flex items-center gap-3 md:gap-4 mb-4 md:mb-8">
                <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl md:rounded-2xl p-2 md:p-4 border-2 border-red-200">
                  <Image
                    src="/images/pests/cupim-illustration.jpg"
                    alt="Cupim"
                    width={60}
                    height={60}
                    className="rounded-lg md:rounded-xl w-12 h-12 md:w-20 md:h-20"
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-4xl font-bold text-gray-900 mb-1">Cupim</h1>
                </div>
              </div>

              {/* Tabela de Preços - PORTAS */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-red-600 mb-2 md:mb-3 border-b-2 border-red-200 pb-2">
                  PORTAS
                </h2>
                <div className="space-y-2">
                  {PRECOS_CUPIM_PORTAS.map((preco) => (
                    <div key={preco.label} className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-200">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{preco.label}</p>
                      <p className="text-xs md:text-sm text-gray-600">1 funcionário – {preco.tempo}</p>
                      <p className="text-base md:text-lg font-bold text-green-600">
                        {formatBRL(preco.cartao)} cartão | {formatBRL(preco.vista)} à vista
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tabela de Preços - SOFÁ */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-red-600 mb-2 md:mb-3 border-b-2 border-red-200 pb-2">
                  SOFÁ
                </h2>
                <div className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-200">
                  <p className="font-semibold text-gray-800 text-sm md:text-base">{PRECO_CUPIM_SOFA.descricao}</p>
                  <p className="text-xs md:text-sm text-gray-600">
                    {PRECO_CUPIM_SOFA.funcionarios} – {PRECO_CUPIM_SOFA.tempo}
                  </p>
                  <p className="text-base md:text-lg font-bold text-green-600">
                    {formatBRL(PRECO_CUPIM_SOFA.valor)}
                  </p>
                </div>
              </div>

              {/* Tabela de Preços - GUARDA-ROUPAS */}
              <div className="mb-4 md:mb-6">
                <h2 className="text-lg md:text-xl font-bold text-red-600 mb-2 md:mb-3 border-b-2 border-red-200 pb-2">
                  GUARDA-ROUPAS
                </h2>
                <div className="space-y-2">
                  {PRECOS_CUPIM_GUARDA_ROUPAS.map((preco) => (
                    <div key={preco.label} className="bg-gray-50 rounded-lg p-2 md:p-3 border border-gray-200">
                      <p className="font-semibold text-gray-800 text-sm md:text-base">{preco.label}</p>
                      <p className="text-xs md:text-sm text-gray-600">1 funcionário – {preco.tempo}</p>
                      <p className="text-base md:text-lg font-bold text-green-600">
                        {formatBRL(preco.cartao)} cartão | {formatBRL(preco.vista)} à vista
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Garantia */}
              <div className="bg-green-100 border-2 border-green-500 rounded-xl p-3 md:p-4 text-center">
                <p className="text-lg md:text-xl font-bold text-green-700">{GARANTIA_CUPIM}</p>
              </div>
            </section>

            <div className="space-y-2 md:space-y-3 overflow-auto pr-0 md:pr-2">
              <div className="bg-red-600 text-white rounded-xl p-3 md:p-4 shadow-lg">
                <h3 className="font-bold mb-2 text-sm md:text-base">CUPIM DE MADEIRA</h3>
                <p className="leading-relaxed text-xs md:text-sm">
                  Injeção pontual no móvel ou porta onde há foco de cupim. O cômodo deve ficar isolado por 24 horas.
                </p>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-3 md:p-4 shadow-lg">
                <h3 className="font-bold mb-2 text-sm md:text-base">Observação</h3>
                <p className="leading-relaxed text-xs md:text-sm">
                  1- Caso o verniz ou pintura esteja velho, corre o risco de aparecer manchas.
                  <br />
                  <br />
                  2- Em alguns casos portas ou moveis com grande degradação podem inchar após o tratamento. Não nos
                  responsabilizamos pelo reparo.
                </p>
              </div>

              <div className="bg-red-600 text-white rounded-xl p-3 md:p-4 shadow-lg">
                <h3 className="font-bold mb-2 text-sm md:text-base">CUPIM SUBTERRÂNEO</h3>
                <p className="leading-relaxed text-xs md:text-sm">
                  Furos com distância de 30 cm e profundidade de 30 a 40 cm em volta do terreno, com injeção de 1 litro
                  de produto em cada furo. Aprox. {formatBRL(VALOR_APROXIMADO_CUPIM_SUBTERRANEO)} para terreno de até
                  250m².
                </p>
              </div>

              <Button
                onClick={copiarTexto}
                className="w-full bg-green-500 hover:bg-green-600 text-white h-10 md:h-12 text-sm md:text-base font-bold rounded-xl shadow-lg sticky bottom-0 active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    COPIADO!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                    COPIAR TEXTO
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
