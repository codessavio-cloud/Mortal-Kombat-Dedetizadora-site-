"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, CreditCard, Banknote, AlertCircle, Home, Building2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import { calculateRatoCondominioPrice, calculateRatoResidentialPrice } from "@/lib/calculators/rato"

export default function RatoPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState<"residencial" | "condominio">("residencial")
  const [area, setArea] = useState("")
  const [tipoVisita, setTipoVisita] = useState<4 | 6>(4)
  const [numBlocos, setNumBlocos] = useState("")
  const [numAndares, setNumAndares] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [portaIscas, setPortaIscas] = useState<number | null>(null)
  const [tempo, setTempo] = useState<string>("")
  const [erro, setErro] = useState("")

  const calcularCondominio = () => {
    setErro("")
    const blocos = Number.parseInt(numBlocos)
    const andares = Number.parseInt(numAndares)

    if (!numBlocos || isNaN(blocos) || blocos < 1 || blocos > 11) {
      setErro("Informe o número de blocos (1 a 11)")
      return
    }
    if (!numAndares || isNaN(andares) || andares < 1) {
      setErro("Informe o número de andares")
      return
    }

    const result = calculateRatoCondominioPrice(blocos, andares, tipoVisita)
    if (!result.pricing) {
      if (result.error === "blocos") {
        setErro("Entre em contato para mais de 11 blocos")
      } else {
        setErro("Erro ao calcular. Entre em contato.")
      }
      return
    }

    setResultadoCartao(result.pricing.cartao)
    setResultadoVista(result.pricing.vista)
    setPortaIscas(result.pricing.portaIscas)
    setTempo(result.pricing.tempo)
    trackBudgetCalculated(`Calculou Rato (condominio) - ${blocos} blocos / ${andares} andares`)
  }

  const infoTexto =
    tipoImovel === "residencial"
      ? `RATO - ORÇAMENTO RESIDENCIAL
Área: ${area}m²
Visitas: ${tipoVisita}
Cartão: R$ ${resultadoCartao?.toFixed(2)}
À Vista: R$ ${resultadoVista?.toFixed(2)}
Porta Iscas: ${portaIscas}
Tempo: ${tempo}

TRATAMENTO COM PORTA ISCAS
Para ratos é necessário fazer um tratamento com instalação de porta iscas (caixinhas pretas) com atrativos. Fazemos a instalação + 03 monitoramentos com intervalos de 10 dias e na quarta visita retiramos se acabar o consumo do produto.

O tratamento consiste em instalação de porta iscas seguido de 3 monitoramentos com intervalo de 10 dias. Garantia de 3 meses.`
      : `RATO - ORÇAMENTO CONDOMÍNIO
Blocos: ${numBlocos}
Andares: ${numAndares}
Visitas: ${tipoVisita}
Cartão: R$ ${resultadoCartao?.toFixed(2)}
À Vista: R$ ${resultadoVista?.toFixed(2)}
Porta Iscas: ${portaIscas}
Tempo: ${tempo}

TRATAMENTO COM PORTA ISCAS
Para ratos é necessário fazer um tratamento com instalação de porta iscas (caixinhas pretas) com atrativos. Fazemos a instalação + 03 monitoramentos com intervalos de 10 dias e na quarta visita retiramos se acabar o consumo do produto.

O tratamento consiste em instalação de porta iscas seguido de 3 monitoramentos com intervalo de 10 dias. Garantia de 3 meses.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Rato")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const calcularOrcamento = useCallback(() => {
    setErro("")
    if (!area || area.trim() === "") {
      setErro("Por favor, informe a área construída")
      return
    }
    const areaNum = Number.parseInt(area.replace(/[^\d]/g, ""))
    if (isNaN(areaNum) || areaNum <= 0) {
      setErro("Por favor, insira uma área válida")
      return
    }
    if (areaNum > 10000) {
      setErro("Área muito grande. Entre em contato.")
      return
    }
    let currentTipoVisita = tipoVisita
    if (areaNum > 1000) {
      currentTipoVisita = 6
      if (tipoVisita !== 6) setTipoVisita(6)
    }
    const pricing = calculateRatoResidentialPrice(areaNum, currentTipoVisita)
    if (!pricing) {
      setErro("Erro ao calcular. Entre em contato.")
      return
    }
    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    setPortaIscas(pricing.portaIscas)
    setTempo(pricing.tempo)
    trackBudgetCalculated(`Calculou Rato (residencial) - ${areaNum}m2 / ${currentTipoVisita} visitas`)
  }, [area, tipoVisita])

  const limpar = () => {
    setArea("")
    setNumBlocos("")
    setNumAndares("")
    setTipoVisita(4)
    setResultadoCartao(null)
    setResultadoVista(null)
    setPortaIscas(null)
    setTempo("")
    setErro("")
  }

  useEffect(() => {
    if (tipoImovel === "residencial" && area && area.trim() !== "") {
      calcularOrcamento()
    }
  }, [tipoVisita, area, tipoImovel, calcularOrcamento])

  const areaNum = area ? Number.parseInt(area.replace(/[^\d]/g, "")) : 0

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 sm:py-3 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Voltar para seleção de pragas</span>
              <span className="sm:hidden">Voltar</span>
            </Link>
            <Image src="/logo.png" alt="Mortal Kombat" width={150} height={40} className="h-8 sm:h-10 w-auto" />
            <div className="w-12 sm:w-20" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-3 sm:py-4">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
            {/* Sidebar - Calculadora */}
            <aside className="w-full lg:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-xl p-4 sm:p-5 border-2 border-gray-200 shadow-lg lg:sticky lg:top-4">
                {/* Titulo com Icone */}
                <div className="flex items-center gap-3 mb-4 sm:mb-5">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-2 border-2 border-gray-200">
                    <span className="text-3xl sm:text-4xl">🐀</span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Rato</h1>
                </div>

                {/* Card da Calculadora */}
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Calculadora de Orçamento</h2>
                  <p className="text-gray-600 text-xs mb-3 sm:mb-4">Preencha os dados para calcular o valor</p>

                  <div className="space-y-3 sm:space-y-4">
                    {/* Tipo de Imovel */}
                    <div>
                      <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                        Tipo de Imóvel
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => {
                            setTipoImovel("residencial")
                            limpar()
                          }}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                            tipoImovel === "residencial"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          <Home className="w-3 h-3" />
                          Residencial
                        </button>
                        <button
                          onClick={() => {
                            setTipoImovel("condominio")
                            limpar()
                          }}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1 active:scale-95 ${
                            tipoImovel === "condominio"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          Condomínio
                        </button>
                      </div>
                    </div>

                    {/* Campos Residencial */}
                    {tipoImovel === "residencial" && (
                      <>
                        <div>
                          <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                            Área Construída (m²)
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 150"
                            value={area}
                            onChange={(e) => setArea(e.target.value)}
                            min="10"
                            max="10000"
                            className="h-10 text-sm border-gray-300 focus:border-red-500 rounded-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">* Considere apenas a área construída</p>
                        </div>

                        <div>
                          <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                            Tipo de Serviço
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setTipoVisita(4)}
                              disabled={areaNum > 1000}
                              className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                                tipoVisita === 4
                                  ? "bg-red-600 text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                              } ${areaNum > 1000 ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              4 Visitas
                            </button>
                            <button
                              onClick={() => setTipoVisita(6)}
                              className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                                tipoVisita === 6
                                  ? "bg-red-600 text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                              }`}
                            >
                              6 Visitas
                            </button>
                          </div>
                          {areaNum > 1000 && (
                            <p className="text-xs text-amber-600 mt-1">* Acima de 1000m² apenas 6 visitas</p>
                          )}
                        </div>
                      </>
                    )}

                    {/* Campos Condominio */}
                    {tipoImovel === "condominio" && (
                      <>
                        <div>
                          <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                            Número de Blocos
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 3"
                            value={numBlocos}
                            onChange={(e) => setNumBlocos(e.target.value)}
                            min="1"
                            max="11"
                            className="h-10 text-sm border-gray-300 focus:border-red-500 rounded-lg"
                          />
                          <p className="text-xs text-gray-500 mt-1">* De 1 a 11 blocos</p>
                        </div>

                        <div>
                          <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                            Número de Andares
                          </Label>
                          <Input
                            type="number"
                            placeholder="Ex: 10"
                            value={numAndares}
                            onChange={(e) => setNumAndares(e.target.value)}
                            min="1"
                            max="40"
                            className="h-10 text-sm border-gray-300 focus:border-red-500 rounded-lg"
                          />
                        </div>

                        <div>
                          <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                            Tipo de Serviço
                          </Label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setTipoVisita(4)}
                              className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                                tipoVisita === 4
                                  ? "bg-red-600 text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                              }`}
                            >
                              4 Visitas
                            </button>
                            <button
                              onClick={() => setTipoVisita(6)}
                              className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                                tipoVisita === 6
                                  ? "bg-red-600 text-white"
                                  : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                              }`}
                            >
                              6 Visitas
                            </button>
                          </div>
                        </div>
                      </>
                    )}

                    {erro && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium">{erro}</p>
                      </div>
                    )}

                    {resultadoCartao !== null && resultadoVista !== null && (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-300">
                          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-2 sm:p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <CreditCard className="w-3 h-3 text-blue-600" />
                              <p className="text-xs text-gray-700 font-semibold">Cartão</p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-blue-700">
                              R$ {resultadoCartao.toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-2 sm:p-3 text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                              <Banknote className="w-3 h-3 text-green-600" />
                              <p className="text-xs text-gray-700 font-semibold">À Vista</p>
                            </div>
                            <p className="text-lg sm:text-xl font-bold text-green-700">
                              R$ {resultadoVista.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        {portaIscas && tempo && (
                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                            <p className="text-xs text-gray-600">
                              <strong>{portaIscas}</strong> porta iscas • <strong>{tempo}</strong> de serviço
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={tipoImovel === "condominio" ? calcularCondominio : calcularOrcamento}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 text-sm font-semibold active:scale-95"
                      >
                        Calcular
                      </Button>
                      <Button
                        onClick={limpar}
                        variant="outline"
                        className="px-4 h-10 text-sm font-semibold border-gray-300 hover:bg-gray-50 bg-transparent active:scale-95"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Conteudo Principal */}
            <div className="flex-1 flex flex-col gap-3 sm:gap-4">
              {/* Cards de informação - scrollable em mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4">
                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <h3 className="font-bold text-sm mb-2">Tratamento com Porta Iscas</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Para ratos é necessário fazer um tratamento com instalação de porta iscas (caixinhas pretas) com
                    atrativos. Fazemos a instalação + 03 monitoramentos com intervalos de 10 dias e na quarta visita
                    retiramos se acabar o consumo do produto. Se continuar com o foco, continuamos o tratamento, pois
                    sua garantia é de 03 meses.
                  </p>
                </div>

                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <h3 className="font-bold text-sm mb-2">Onde tem 1, tem 10</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Geralmente onde tem 1 rato, tem no mínimo 10 pois eles andam sempre de bando. Para começar a morrer
                    demora em média de 05 a 07 dias, pois são muito inteligentes, eles mandam os mais velhos e doentes
                    fazer o consumo primeiro, se observarem que não morreram de imediato, os outros também faz o
                    consumo, e o tratamento faz o controle de toda a ninhada.
                  </p>
                </div>

                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <h3 className="font-bold text-sm mb-2">Único Tratamento Eficaz</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    O tratamento consiste em instalação de porta iscas seguido de 3 monitoramentos com intervalo de 10
                    dias. Garantia de 3 meses.
                  </p>
                </div>
              </div>

              {/* Orientações */}
              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6 shadow-sm flex-1">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">ORIENTAÇÕES</h2>

                <div className="space-y-3 sm:space-y-4">
                  <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                    O tratamento consiste em instalação de porta iscas seguido de 3 monitoramentos com intervalo de 10
                    dias. Garantia de 3 meses.
                  </p>

                  <Button
                    onClick={copiarTexto}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-10 sm:h-12 text-sm sm:text-base font-semibold active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        COPIAR TODAS AS INFORMAÇÕES
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
