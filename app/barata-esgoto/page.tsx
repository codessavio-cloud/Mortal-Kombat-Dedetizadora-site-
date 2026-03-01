"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, CreditCard, Banknote, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import {
  BARATA_ESGOTO_CONDOMINIO_PRICING,
  calculateBarataEsgotoPrice,
  findClosestFloorRange,
  formatHours,
} from "@/lib/calculators/barata-esgoto"
import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

export default function BarataEsgotoPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState("")
  const [area, setArea] = useState("")
  const [numBlocos, setNumBlocos] = useState("")
  const [numAndares, setNumAndares] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [erro, setErro] = useState("")
  const infoTexto =
    tipoImovel === "condominio"
      ? `BARATA DE ESGOTO - CONDOMINIO

Blocos: ${numBlocos || "-"}
Andares: ${numAndares || "-"}
Cartao: ${resultadoCartao !== null ? `R$ ${resultadoCartao.toFixed(2)}` : "-"}
A vista: ${resultadoVista !== null ? `R$ ${resultadoVista.toFixed(2)}` : "-"}

Procedimento: pulverizacao de rodapes, ralos, caixa de gordura e pontos de infestacao.
Afastamento: 4 a 6h (24h para gestantes, idosos, pessoas alergicas e pets).`
      : `BARATA DE ESGOTO

Tipo de imovel: ${tipoImovel || "-"}
Area: ${area || "-"} m2
Cartao: ${resultadoCartao !== null ? `R$ ${resultadoCartao.toFixed(2)}` : "-"}
A vista: ${resultadoVista !== null ? `R$ ${resultadoVista.toFixed(2)}` : "-"}

Procedimento: pulverizacao de rodapes, ralos, caixa de gordura e pontos de infestacao.
Afastamento: 4 a 6h (24h para gestantes, idosos, pessoas alergicas e pets).`

  const calcularFuncionariosEHoras = () => {
    if (!numBlocos || !numAndares) return { funcionarios: 0, horas: 0 }

    const blocos = Number.parseInt(numBlocos)
    const andares = Number.parseInt(numAndares)

    if (isNaN(blocos) || isNaN(andares) || blocos <= 0 || andares <= 0) {
      return { funcionarios: 0, horas: 0 }
    }

    if (blocos > 11) {
      return { funcionarios: 0, horas: 0 }
    }

    const blockPricing = BARATA_ESGOTO_CONDOMINIO_PRICING[blocos as keyof typeof BARATA_ESGOTO_CONDOMINIO_PRICING]
    if (!blockPricing) return { funcionarios: 0, horas: 0 }

    const availableRanges = Object.keys(blockPricing).map(Number)
    const floorRange = findClosestFloorRange(andares, availableRanges)

    if (floorRange === 0) return { funcionarios: 0, horas: 0 }

    const pricing = blockPricing[floorRange as keyof typeof blockPricing]
    return { funcionarios: pricing.funcionarios, horas: pricing.horas }
  }

  const { funcionarios, horas } = calcularFuncionariosEHoras()

  const calcularOrcamento = useCallback(() => {
    setErro("")

    if (!tipoImovel) {
      setErro("Por favor, selecione o tipo de imóvel")
      return
    }

    if (tipoImovel === "condominio") {
      if (!numBlocos || !numAndares) {
        setErro("Por favor, preencha a quantidade de blocos e andares")
        return
      }

      const blocos = Number.parseInt(numBlocos)
      const andares = Number.parseInt(numAndares)

      if (isNaN(blocos) || isNaN(andares)) {
        setErro("Por favor, insira valores numéricos válidos")
        return
      }

      if (blocos <= 0 || andares <= 0) {
        setErro("Todos os valores devem ser maiores que zero")
        return
      }

      if (blocos > 11) {
        setErro("Para condomínios com mais de 11 blocos, entre em contato para orçamento personalizado")
        return
      }

      const blockPricing = BARATA_ESGOTO_CONDOMINIO_PRICING[blocos as keyof typeof BARATA_ESGOTO_CONDOMINIO_PRICING]
      if (!blockPricing) {
        setErro(`Não há preços disponíveis para ${blocos} bloco(s). Entre em contato para orçamento personalizado.`)
        return
      }

      const availableRanges = Object.keys(blockPricing).map(Number)
      const floorRange = findClosestFloorRange(andares, availableRanges)

      if (floorRange === 0) {
        setErro("Não foi possível calcular o preço. Entre em contato para orçamento personalizado.")
        return
      }

      const pricing = blockPricing[floorRange as keyof typeof blockPricing]

      setResultadoCartao(applyPriceIncrease(pricing.cartao))
      setResultadoVista(applyPriceIncrease(pricing.vista))
      trackBudgetCalculated(`Calculou Barata de Esgoto (condominio) - ${blocos} blocos / ${andares} andares`)
      return
    }

    if (!area || area.trim() === "") {
      setErro("Por favor, informe a área construída")
      return
    }

    const areaLimpa = area.replace(/[^\d]/g, "")
    const areaNum = Number.parseInt(areaLimpa)

    if (isNaN(areaNum) || areaNum <= 0) {
      setErro("Por favor, insira uma área válida maior que zero")
      return
    }

    if (areaNum > 10000) {
      setErro("Área muito grande. Entre em contato para orçamento personalizado")
      return
    }

    // Limite da sua tabela para comércio/barracão
    if ((tipoImovel === "comercio" || tipoImovel === "barracao") && areaNum > 2000) {
      setErro("Para comércios e barracões acima de 2000 m², entre em contato para orçamento personalizado")
      return
    }

    if (areaNum < 10) {
      setErro("Área muito pequena. A área mínima é de 10m²")
      return
    }

    const pricing = calculateBarataEsgotoPrice(areaNum, tipoImovel)

    if (!pricing) {
      setErro("Erro ao calcular o preço. Entre em contato para orçamento personalizado")
      return
    }

    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    trackBudgetCalculated(`Calculou Barata de Esgoto (${tipoImovel}) - ${areaNum}m2`)
  }, [area, numAndares, numBlocos, tipoImovel])

  const limpar = () => {
    setTipoImovel("")
    setArea("")
    setNumBlocos("")
    setNumAndares("")
    setResultadoCartao(null)
    setResultadoVista(null)
    setErro("")
  }

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Barata de Esgoto")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  useEffect(() => {
    if (tipoImovel === "condominio") {
      if (numBlocos && numAndares) {
        calcularOrcamento()
      }
    } else if (tipoImovel && area && area.trim() !== "") {
      calcularOrcamento()
    }
  }, [tipoImovel, area, numBlocos, numAndares, calcularOrcamento])

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 md:py-4 flex-shrink-0">
        <div className="container mx-auto px-3 md:px-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-sm md:text-base active:scale-95"
          >
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="flex-1 overflow-auto">
        <div className="container mx-auto px-3 md:px-4 py-3 md:py-6 flex flex-col lg:flex-row gap-4 md:gap-6">
          <section className="w-full lg:w-[350px] flex-shrink-0 bg-white rounded-xl p-4 md:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="bg-red-50 rounded-xl p-1.5 md:p-2 border border-red-200">
                <Image
                  src="/images/pests/barata-esgoto-illustration.jpg"
                  alt="Barata de Esgoto"
                  width={50}
                  height={50}
                  className="rounded-lg w-10 h-10 md:w-[60px] md:h-[60px]"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Barata de Esgoto</h1>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border-2 border-red-300">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Calculadora de Orçamento</h2>
              <p className="text-gray-600 text-sm mb-4 md:mb-6">Preencha os dados para calcular o valor</p>

              <div className="space-y-4 md:space-y-6">
                <div>
                  <Label className="text-sm md:text-base font-semibold mb-2 md:mb-3 block">Tipo de Imóvel</Label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    <button
                      onClick={() => setTipoImovel("casa")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-all active:scale-95 ${
                        tipoImovel === "casa"
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      Casa
                    </button>
                    <button
                      onClick={() => setTipoImovel("apartamento")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-all active:scale-95 ${
                        tipoImovel === "apartamento"
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      Apartamento
                    </button>
                    <button
                      onClick={() => setTipoImovel("comercio")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-all active:scale-95 ${
                        tipoImovel === "comercio"
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      Comércio
                    </button>
                    <button
                      onClick={() => setTipoImovel("barracao")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-all active:scale-95 ${
                        tipoImovel === "barracao"
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      Barracão
                    </button>
                    <button
                      onClick={() => setTipoImovel("condominio")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm md:text-base transition-all col-span-2 active:scale-95 ${
                        tipoImovel === "condominio"
                          ? "bg-red-600 text-white shadow-lg"
                          : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      Condomínio
                    </button>
                  </div>
                </div>

                {tipoImovel === "condominio" && (
                  <div className="space-y-3 md:space-y-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 md:p-4">
                    <div className="flex items-start gap-2 mb-2 md:mb-3">
                      <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs md:text-sm text-yellow-800 font-semibold">
                        Informe a quantidade de blocos e andares.
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm font-semibold mb-1 md:mb-2 block">
                        Quantidade de Blocos *
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 1"
                        value={numBlocos}
                        onChange={(e) => setNumBlocos(e.target.value)}
                        className="h-10 md:h-11 text-sm md:text-base"
                        min="1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm font-semibold mb-1 md:mb-2 block">
                        Quantidade de Andares *
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 4"
                        value={numAndares}
                        onChange={(e) => setNumAndares(e.target.value)}
                        className="h-10 md:h-11 text-sm md:text-base"
                        min="1"
                      />
                    </div>

                    {funcionarios > 0 && horas > 0 && (
                      <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-3 md:p-4 space-y-2">
                        <p className="text-xs md:text-sm font-semibold text-blue-900">Calculado automaticamente:</p>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          <div className="bg-white rounded-lg p-2 md:p-3 text-center">
                            <p className="text-[10px] md:text-xs text-gray-600 mb-1">Funcionários</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-700">{funcionarios}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 md:p-3 text-center">
                            <p className="text-[10px] md:text-xs text-gray-600 mb-1">Horas</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-700">{formatHours(horas)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tipoImovel !== "condominio" && (
                  <div>
                    <Label className="text-sm md:text-base font-semibold mb-1 md:mb-2 block">
                      Área Construída (m²)
                    </Label>
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      className="h-10 md:h-12 text-sm md:text-base"
                    />
                    <p className="text-xs md:text-sm text-gray-500 mt-1 md:mt-2">
                      * Considere apenas a área construída
                    </p>
                  </div>
                )}

                {erro && (
                  <div className="bg-red-50 border border-red-300 rounded-lg p-2 md:p-3 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm text-red-700 font-medium">{erro}</p>
                  </div>
                )}

                {resultadoCartao !== null && resultadoVista !== null && (
                  <div className="grid grid-cols-2 gap-2 md:gap-3 animate-in fade-in duration-300">
                    <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-3 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                        <CreditCard className="w-3 h-3 md:w-4 md:h-4 text-blue-600" />
                        <p className="text-[10px] md:text-xs text-gray-700 font-semibold">Cartão</p>
                      </div>
                      <p className="text-lg md:text-2xl font-bold text-blue-700">R$ {resultadoCartao.toFixed(2)}</p>
                    </div>
                    <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3 md:p-4 text-center">
                      <div className="flex items-center justify-center gap-1 md:gap-1.5 mb-1 md:mb-1.5">
                        <Banknote className="w-3 h-3 md:w-4 md:h-4 text-green-600" />
                        <p className="text-[10px] md:text-xs text-gray-700 font-semibold">A Vista</p>
                      </div>
                      <p className="text-lg md:text-2xl font-bold text-green-700">R$ {resultadoVista.toFixed(2)}</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-2 md:gap-3">
                  <Button
                    onClick={calcularOrcamento}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 md:h-12 text-sm md:text-lg font-bold rounded-xl active:scale-95"
                  >
                    Calcular
                  </Button>
                  <Button
                    onClick={limpar}
                    variant="outline"
                    className="flex-1 h-10 md:h-12 text-sm md:text-lg font-semibold rounded-xl border-2 bg-transparent active:scale-95"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          </section>

          <div className="flex-1 flex flex-col gap-3 md:gap-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 flex-shrink-0">
              <div className="bg-white rounded-xl p-3 md:p-4 border-2 md:border-4 border-black shadow-lg">
                <p className="text-xs md:text-sm leading-relaxed">
                  Pulverização de rodapés, ralos e caixas de esgoto. Tratamento especializado para controle efetivo de
                  baratas de esgoto com garantia de 3 meses.
                </p>
              </div>

              <div className="hidden md:block"></div>

              <div className="bg-white rounded-xl p-3 md:p-4 border-2 md:border-4 border-black shadow-lg">
                <p className="text-xs md:text-sm leading-relaxed">
                  E normal aparecer uma ou outra barata, pois as baratas de esgoto têm hábitos noturnos. Ao sair do
                  local onde estão escondidas, elas entram em contato com o residual do produto, podendo levar até 4
                  horas para morrer.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-3 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center">ORIENTAÇÕES</h2>

              <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
                <div>
                  <p className="leading-relaxed">
                    <strong>Procedimento:</strong> Pulverizamos com bomba elétrica o rodapé de todo o local, dentro de
                    armários da cozinha e banheiros, e os possíveis pontos de infestação como ralos, caixa de gordura e
                    grelhas.
                  </p>
                </div>

                <div>
                  <p className="leading-relaxed">
                    <strong>Antes da Dedetização:</strong> E necessário retirar todos os itens dos armários da cozinha e
                    do banheiro para que possamos dedetizar essas áreas, onde geralmente há maior foco de infestação.
                  </p>
                </div>

                <div>
                  <p className="leading-relaxed">
                    <strong>Após a Dedetização:</strong> Você pode passar um pano úmido, mas a limpeza pesada deve ser
                    feita somente após 48 horas. Deixe uma janela ou porta aberta para permitir a circulação de ar.
                  </p>
                </div>

                <div>
                  <p className="leading-relaxed">
                    <strong>Afastamento:</strong> E necessario ficar fora do local de 4 a 6 horas. Gestantes, idosos,
                    animais de estimação e pessoas alérgicas devem ficar fora por 24 horas.
                  </p>
                </div>

                <div>
                  <p className="leading-relaxed">
                    <strong>Cuidados com Animais:</strong> Guarde TODOS os pertences dos animais, incluindo vasilhas de
                    água e ração, em locais seguros. Quando retornar com o animal, lave-o com água e sabão corrente.
                  </p>
                </div>

                <div className="mt-4 md:mt-6 pt-3 md:pt-4 border-t-2 border-gray-200">
                  <Button
                    onClick={copiarTexto}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-10 md:h-12 text-sm md:text-base font-semibold active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 md:w-5 md:h-5 mr-2" />
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


