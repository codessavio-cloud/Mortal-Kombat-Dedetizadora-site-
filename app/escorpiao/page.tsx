"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import {
  calculateEscorpiaoPrice,
  findEscorpiaoCondominioPricing,
  formatEscorpiaoHours,
  getEscorpiaoCondominioLabor,
} from "@/lib/calculators/escorpiao"
import { formatBRL } from "@/lib/calculators/price-adjustment"

export default function EscorpiaoPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState("")
  const [area, setArea] = useState("")
  const [numBlocos, setNumBlocos] = useState("")
  const [numAndares, setNumAndares] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [erro, setErro] = useState("")

  const calcularFuncionariosEHoras = () => {
    if (!numBlocos || !numAndares) return { funcionarios: 0, horas: 0 }
    const blocos = Number.parseInt(numBlocos)
    const andares = Number.parseInt(numAndares)
    if (isNaN(blocos) || isNaN(andares) || blocos <= 0 || andares <= 0) return { funcionarios: 0, horas: 0 }
    return getEscorpiaoCondominioLabor(blocos, andares)
  }

  const { funcionarios, horas } = calcularFuncionariosEHoras()

  const infoTexto = `ESCORPIÃO - Informações Importantes

Nosso serviço tem como objetivo o controle, não a eliminação total imediata. O escorpião precisa entrar em contato com o produto para que ele atue. Alguns morrem rapidamente, enquanto outros podem levar até 24 horas para morrerem.

Assim que há o contato com o produto, o escorpião já começa a ser afetado, ficando desorientado, mais lento e incapaz de atacar, vindo a morrer logo em seguida.

Pulverização de rodapés, ralos e caixas de esgoto.

Garantia: 1 mês

Procedimento: Pulverizar com bomba elétrica rodapés, ralos, caixas de gordura e grelhas.

Antes: afastar móveis se desejar.

Após: pano úmido ok, limpeza pesada só após 48h.

Afastamento: 4–6 horas (24h para gestantes, alérgicos e animais).

Cuidados com animais: guardar pertences, lavar vasilhas ao retornar.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Escorpiao")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const calcularOrcamento = useCallback(() => {
    setErro("")
    setResultadoCartao(null)
    setResultadoVista(null)
    if (!tipoImovel) return

    if (tipoImovel === "condominio") {
      if (!numBlocos || !numAndares) return
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
      if (andares > 40) {
        setErro("Para condomínios com mais de 40 andares, entre em contato para orçamento personalizado")
        return
      }
      const result = findEscorpiaoCondominioPricing(blocos, andares)
      if (!result.pricing) {
        if (result.error === "blocos")
          setErro(`Para condomínios com ${blocos} blocos, entre em contato para orçamento personalizado`)
        else if (result.error === "andares")
          setErro(
            `Para condomínios com ${andares} andares e ${blocos} bloco(s), entre em contato para orçamento personalizado`,
          )
        else setErro("Para esta combinação de blocos e andares, entre em contato para orçamento personalizado")
        return
      }
      setResultadoCartao(result.pricing.cartao)
      setResultadoVista(result.pricing.vista)
      trackBudgetCalculated(`Calculou Escorpiao (condominio) - ${blocos} blocos / ${andares} andares`)
      return
    }

    if (!area || area.trim() === "") return
    const areaNum = Number.parseInt(area)
    if (isNaN(areaNum) || areaNum <= 0) {
      setErro("Por favor, insira uma área válida")
      return
    }

    const pricing = calculateEscorpiaoPrice(areaNum, tipoImovel)
    if (!pricing) {
      setErro("Erro ao calcular. Entre em contato para orçamento personalizado")
      return
    }

    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    trackBudgetCalculated(`Calculou Escorpiao (${tipoImovel}) - ${areaNum}m2`)
  }, [area, numAndares, numBlocos, tipoImovel])

  useEffect(() => {
    if (
      tipoImovel &&
      ((tipoImovel === "condominio" && numBlocos && numAndares) || (tipoImovel !== "condominio" && area))
    ) {
      calcularOrcamento()
    }
  }, [tipoImovel, area, numBlocos, numAndares, calcularOrcamento])

  const limpar = () => {
    setTipoImovel("")
    setArea("")
    setNumBlocos("")
    setNumAndares("")
    setResultadoCartao(null)
    setResultadoVista(null)
    setErro("")
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 md:py-4 flex-shrink-0">
        <div className="container mx-auto px-3 md:px-4">
          <Link
            href="/"
            className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-sm active:scale-95"
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
                  src="/images/pests/escorpiao-illustration.jpg"
                  alt="Escorpião"
                  width={50}
                  height={50}
                  className="rounded-lg w-10 h-10 md:w-[60px] md:h-[60px]"
                />
              </div>
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-gray-900">Escorpião</h1>
              </div>
            </div>

            <div className="bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-md border-2 border-red-500">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-1 md:mb-2">Calculadora de Orçamento</h2>
              <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-6">Preencha os dados para calcular</p>

              <div className="space-y-4 md:space-y-6">
                <div>
                  <Label className="text-sm md:text-base font-semibold mb-2 md:mb-3 block">Tipo de Imóvel</Label>
                  <div className="grid grid-cols-2 gap-2 md:gap-3">
                    {["casa", "apartamento", "comercio", "barracao"].map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => setTipoImovel(tipo)}
                        className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm transition-all active:scale-95 ${tipoImovel === tipo ? "bg-red-600 text-white shadow-lg" : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"}`}
                      >
                        {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                      </button>
                    ))}
                    <button
                      onClick={() => setTipoImovel("condominio")}
                      className={`py-2 md:py-3 px-3 md:px-4 rounded-lg font-medium text-sm transition-all col-span-2 active:scale-95 ${tipoImovel === "condominio" ? "bg-red-600 text-white shadow-lg" : "bg-white border-2 border-gray-300 text-gray-700 hover:border-red-400"}`}
                    >
                      Condomínio
                    </button>
                  </div>
                </div>

                {tipoImovel === "condominio" && (
                  <div className="space-y-3 md:space-y-4 bg-yellow-50 border-2 border-yellow-400 rounded-xl p-3 md:p-4">
                    <div className="flex items-start gap-2 mb-2 md:mb-3">
                      <AlertCircle className="w-4 h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs md:text-sm text-yellow-800 font-semibold">Informe blocos e andares.</p>
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
                        <p className="text-xs md:text-sm font-semibold text-blue-900">Calculado:</p>
                        <div className="grid grid-cols-2 gap-2 md:gap-3">
                          <div className="bg-white rounded-lg p-2 md:p-3 text-center">
                            <p className="text-[10px] md:text-xs text-gray-600 mb-1">Funcionários</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-700">{funcionarios}</p>
                          </div>
                          <div className="bg-white rounded-lg p-2 md:p-3 text-center">
                            <p className="text-[10px] md:text-xs text-gray-600 mb-1">Horas</p>
                            <p className="text-xl md:text-2xl font-bold text-blue-700">
                              {formatEscorpiaoHours(horas)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {tipoImovel !== "condominio" && tipoImovel && (
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

                {resultadoCartao !== null && resultadoVista !== null && (
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    <div className="bg-blue-50 p-3 md:p-4 rounded-xl text-center border-2 border-blue-200">
                      <span className="text-xs md:text-sm text-blue-700 font-semibold">Cartão</span>
                      <div className="text-lg md:text-2xl font-bold text-blue-800">{formatBRL(resultadoCartao)}</div>
                    </div>
                    <div className="bg-green-50 p-3 md:p-4 rounded-xl text-center border-2 border-green-200">
                      <span className="text-xs md:text-sm text-green-700 font-semibold">À Vista</span>
                      <div className="text-lg md:text-2xl font-bold text-green-800">{formatBRL(resultadoVista)}</div>
                    </div>
                  </div>
                )}

                {erro && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-2 md:p-3 rounded-lg text-xs md:text-sm">
                    {erro}
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
                <h3 className="font-bold text-xs md:text-sm mb-2">Pulverização</h3>
                <p className="text-[10px] md:text-xs leading-relaxed">
                  Para baratas de esgoto (grandes) e escorpião, fazemos a pulverização de todo rodapé, caixa de esgoto e
                  ralinhos. Garantias: Baratas: 3 meses. Escorpião: 1 mês
                </p>
              </div>
              <div className="bg-white rounded-xl p-3 md:p-4 border-2 md:border-4 border-black shadow-lg">
                <h3 className="font-bold text-xs md:text-sm mb-2">Piolho de Cobra e Lacraias</h3>
                <p className="text-[10px] md:text-xs leading-relaxed">
                  Dedetização com produto de escorpião, sem garantia pois vêm do chão de terrenos próximos.
                </p>
              </div>
              <div className="bg-yellow-300 rounded-xl p-3 md:p-4 border-2 md:border-4 border-orange-500 shadow-lg">
                <h3 className="font-bold text-xs md:text-sm mb-2 text-orange-800">Garantia</h3>
                <p className="text-[10px] md:text-xs leading-relaxed text-orange-900 font-medium">
                  3 meses para baratas de esgoto e 1 mês para escorpião.
                </p>
              </div>
            </div>

            <div className="bg-orange-500 text-white rounded-xl p-3 md:p-4 shadow-lg border-2 md:border-4 border-orange-700">
              <p className="text-xs md:text-sm leading-relaxed font-medium">
                <strong>Nosso serviço tem como objetivo o controle</strong>, não a eliminação total imediata. O
                escorpião precisa entrar em contato com o produto. Alguns morrem rapidamente, outros podem levar até
                24h.
              </p>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-4 md:p-6 border border-gray-200">
              <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center">ORIENTAÇÕES</h2>
              <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
                <p className="leading-relaxed">
                  <strong>Procedimento:</strong> Pulverizar rodapés, ralos, caixas de gordura e grelhas.
                </p>
                <p className="leading-relaxed">
                  <strong>Antes:</strong> afastar móveis se desejar.
                </p>
                <p className="leading-relaxed">
                  <strong>Após:</strong> pano úmido ok, limpeza pesada só após 48h.
                </p>
                <p className="leading-relaxed">
                  <strong>Afastamento:</strong> 4–6h (24h para gestantes, alérgicos e animais).
                </p>
                <p className="leading-relaxed">
                  <strong>Animais:</strong> guardar pertences, lavar vasilhas ao retornar.
                </p>

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
