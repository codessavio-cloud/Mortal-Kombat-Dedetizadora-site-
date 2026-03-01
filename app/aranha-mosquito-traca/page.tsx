"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, CreditCard, Banknote, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import { calculateAranhaMosquitoTracaPrice } from "@/lib/calculators/aranha-mosquito-traca"

export default function AranhaMosquitoTracaPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState("")
  const [area, setArea] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [erro, setErro] = useState("")

  const infoTexto = `ARANHAS, MOSQUITOS E PIOLHO DE POMBOS - Informacoes Importantes

-------------------------------------------------------
ARANHAS
-------------------------------------------------------
Atomizacao (neblina) para atingir cantos altos.
Garantia: 3 meses.
Procedimento: Aplicacao com atomizador para alcancar areas elevadas e de dificil acesso.
Apos: pano umido ok, limpeza pesada so apos 48h.
Afastamento: 4-6 horas (24h para gestantes, alergicos e animais).

-------------------------------------------------------
MOSQUITOS E PERNILONGOS
-------------------------------------------------------
Atomizacao (fumace).
Mata os insetos no local, mas sem garantia (vem de fora).
Nao deixa residual igual a pulverizacao.
Procedimento: Aplicacao de fumace que elimina mosquitos presentes no momento.
Observacao: Nao possui efeito residual prolongado, pois mosquitos podem vir de areas externas.

-------------------------------------------------------
PIOLHO DE POMBOS (PIOLHO DE PASSAROS)
-------------------------------------------------------
Para os piolhos de passaros fazemos uma atomizacao, que e como se fosse uma neblina, abrangendo atras dos moveis e frestas onde eles ficam.
IMPORTANTE: O foco dos piolhos sao os ninhos. Se estes nao forem retirados NAO RESOLVE fazer a dedetizacao. A remocao dos ninhos e obrigatoria para o sucesso do tratamento.
- Remocao de ninhos: se os ninhos estiverem de facil acesso, nosso tecnico faz a retirada. Caso contrario, o cliente deve providenciar a retirada antes do tratamento.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Aranha/Mosquito/Piolho")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const calcularOrcamento = useCallback(() => {
    setErro("")

    if (!tipoImovel) {
      setErro("Por favor, selecione o tipo de imóvel")
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

    if (areaNum < 10) {
      setErro("Área muito pequena. A área mínima é de 10m²")
      return
    }

    const pricing = calculateAranhaMosquitoTracaPrice(areaNum, tipoImovel)
    if (!pricing) {
      setErro("Erro ao calcular o preco. Entre em contato para orcamento personalizado")
      return
    }

    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    trackBudgetCalculated(`Calculou Aranha/Mosquito/Piolho (${tipoImovel}) - ${areaNum}m2`)
  }, [area, tipoImovel])

  const limpar = () => {
    setTipoImovel("")
    setArea("")
    setResultadoCartao(null)
    setResultadoVista(null)
    setErro("")
  }

  useEffect(() => {
    if (tipoImovel && area && area.trim() !== "") {
      calcularOrcamento()
    }
  }, [tipoImovel, area, calcularOrcamento])

  return (
    <div className="min-h-[100dvh] flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 md:py-3 flex-shrink-0">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-xs md:text-sm active:scale-95"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Voltar
            </Link>
            <Image src="/logo.png" alt="Mortal Kombat" width={120} height={30} className="h-8 md:h-10 w-auto" />
            <div className="w-16 md:w-20" />
          </div>
        </div>
      </header>

      <main className="flex-1 py-3 md:py-4 overflow-auto">
        <div className="container mx-auto px-3 md:px-4">
          <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
            <aside className="w-full lg:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-xl p-4 md:p-6 border-2 border-gray-200 shadow-lg lg:sticky lg:top-4">
                <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-2 md:p-3 border-2 border-red-200">
                    <Image
                      src="/images/pests/aranha-mosquito-traca-illustration.jpg"
                      alt="Aranha, Mosquito e Piolho"
                      width={50}
                      height={50}
                      className="rounded-lg w-10 h-10 md:w-[60px] md:h-[60px]"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg md:text-2xl font-bold text-gray-900">Aranha, Mosquito e Piolho</h1>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 md:p-5 shadow-md border-2 border-red-300">
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-1">Calculadora de Orçamento</h2>
                  <p className="text-gray-600 text-xs md:text-sm mb-4 md:mb-5">Preencha os dados para calcular</p>

                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <Label className="text-xs md:text-sm font-semibold mb-2 block text-gray-800">
                        Tipo de Imóvel
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        {["casa", "apartamento", "comercio", "barracao"].map((tipo) => (
                          <button
                            key={tipo}
                            onClick={() => setTipoImovel(tipo)}
                            className={`py-2 px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                              tipoImovel === tipo
                                ? "bg-red-600 text-white"
                                : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                            }`}
                          >
                            {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs md:text-sm font-semibold mb-2 block text-gray-800">
                        Área Construída (m²)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 100"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        min="10"
                        max="10000"
                        className="h-9 md:h-10 text-sm border-gray-300 focus:border-red-500 rounded-lg"
                      />
                      <p className="text-[10px] md:text-xs text-gray-500 mt-1">
                        * Para dedetização, considere apenas a área construída
                      </p>
                    </div>

                    {erro && (
                      <div className="bg-red-50 border border-red-300 rounded-lg p-2 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 font-medium">{erro}</p>
                      </div>
                    )}

                    {resultadoCartao !== null && resultadoVista !== null && (
                      <div className="grid grid-cols-2 gap-2 animate-in fade-in duration-300">
                        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-2 md:p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <p className="text-[10px] md:text-xs text-gray-700 font-semibold">Cartão</p>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-blue-700">R$ {resultadoCartao.toFixed(2)}</p>
                        </div>
                        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-2 md:p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Banknote className="w-3 h-3 text-green-600" />
                            <p className="text-[10px] md:text-xs text-gray-700 font-semibold">A Vista</p>
                          </div>
                          <p className="text-lg md:text-xl font-bold text-green-700">R$ {resultadoVista.toFixed(2)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={calcularOrcamento}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 md:h-10 text-sm font-semibold active:scale-95"
                      >
                        Calcular
                      </Button>
                      <Button
                        onClick={limpar}
                        variant="outline"
                        className="px-4 md:px-5 h-9 md:h-10 text-sm font-semibold border-gray-300 hover:bg-gray-50 bg-transparent active:scale-95"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-3 md:mb-4">
                <div className="bg-white border-2 md:border-4 border-black rounded-lg p-3 md:p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Aranhas</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Fazemos uma atomização (neblina), para atingir cantos altos e áreas onde aranhas fazem teia costumam
                    se abrigar. Após a aplicação é necessário retirar todas as teias de aranhas, para garantia de 3
                    meses
                  </p>
                </div>

                <div className="bg-white border-2 md:border-4 border-black rounded-lg p-3 md:p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Mosquitos e pernilongos</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Para mosquitos, pernilongos é necessário fazer uma atomização no local, como o fumacê. Não
                    conseguimos oferecer garantia pois vêm de fora e não conseguimos tratar o foco.
                  </p>
                </div>

                <div className="bg-white border-2 md:border-4 border-black rounded-lg p-3 md:p-4 shadow-sm">
                  <h3 className="font-bold text-gray-900 text-sm mb-2">Piolho de pássaros</h3>
                  <p className="text-xs text-gray-700 leading-relaxed">
                    Para os piolhos de pássaros fazemos uma atomização. O foco dos piolhos são os ninhos, se estes não
                    forem retirados não resolve fazer a dedetização.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 md:p-6 shadow-sm">
                <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-3 md:mb-4 text-center">ORIENTACOES</h2>

                <div className="space-y-3 md:space-y-4 text-xs md:text-sm">
                  <div>
                    <p className="text-gray-800 leading-relaxed">
                      <strong>Procedimentos:</strong> Atomizamos com atomizador elétrico área interna.
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-800 leading-relaxed">
                      <strong>Antes da Atomização:</strong> Caso queira afastar os móveis é aconselhável, porém não
                      obrigatório. Guardar roupas de cama e toalhas.
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-800 leading-relaxed">
                      <strong>Após a Atomização:</strong> Pode passar pano úmido, porém limpeza pesada somente após 48
                      horas.
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-800 leading-relaxed">
                      <strong>Afastamento:</strong> 4 a 6 horas. Gestantes, animais e pessoas alérgicas: 24 horas.
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-800 leading-relaxed">
                      <strong>Cuidados com animais:</strong> Guardar TODOS os pertences dos animais e lavar com água e
                      sabão ao retornar.
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
                          COPIAR TODAS AS INFORMACOES
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

