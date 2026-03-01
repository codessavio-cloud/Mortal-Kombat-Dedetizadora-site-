"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, CreditCard, Banknote, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import { calculateBaratinhaPrice } from "@/lib/calculators/baratinha"
import { formatBRL } from "@/lib/calculators/price-adjustment"

export default function BaratinhaPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState("")
  const [area, setArea] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [erro, setErro] = useState("")
  const infoTexto = `BARATINHA - INFORMACOES IMPORTANTES

Tipo de imovel: ${tipoImovel || "-"}
Area: ${area || "-"} m2
Cartao: ${resultadoCartao !== null ? formatBRL(resultadoCartao) : "-"}
A vista: ${resultadoVista !== null ? formatBRL(resultadoVista) : "-"}

O tratamento e feito em duas aplicacoes com intervalo de 15 dias.
Pulverizacao inicial + reforco em gel para eliminar ninfas apos eclosao.
Garantia e orientacoes conforme informado no atendimento.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Baratinha")
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

    const pricing = calculateBaratinhaPrice(areaNum, tipoImovel)

    if (!pricing) {
      setErro("Erro ao calcular o preço. Entre em contato para orçamento personalizado")
      return
    }

    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    trackBudgetCalculated(`Calculou Baratinha (${tipoImovel}) - ${areaNum}m2`)
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 sm:py-3 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center text-gray-700 hover:text-red-600 font-semibold transition-colors text-xs sm:text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Voltar</span>
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
            {/* Sidebar */}
            <aside className="w-full lg:w-[350px] flex-shrink-0">
              <div className="bg-white rounded-xl p-4 sm:p-6 border-2 border-gray-200 shadow-lg lg:sticky lg:top-4">
                <div className="flex items-center gap-3 mb-4 sm:mb-6">
                  <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-2 sm:p-3 border-2 border-red-200">
                    <Image
                      src="/images/pests/baratinha-illustration.jpg"
                      alt="Baratinha"
                      width={60}
                      height={60}
                      className="rounded-lg w-10 h-10 sm:w-14 sm:h-14"
                    />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Baratinha</h1>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl p-4 sm:p-5 shadow-md border-2 border-red-300">
                  <h2 className="text-base sm:text-xl font-bold text-gray-900 mb-1">Calculadora de Orçamento</h2>
                  <p className="text-gray-600 text-xs mb-3 sm:mb-5">
                    Preencha os dados para calcular o valor do serviço
                  </p>

                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                        Tipo de Imóvel
                      </Label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => setTipoImovel("casa")}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                            tipoImovel === "casa"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          Casa
                        </button>
                        <button
                          onClick={() => setTipoImovel("apartamento")}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                            tipoImovel === "apartamento"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          Apartamento
                        </button>
                        <button
                          onClick={() => setTipoImovel("comercio")}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                            tipoImovel === "comercio"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          Comércio
                        </button>
                        <button
                          onClick={() => setTipoImovel("barracao")}
                          className={`py-2 px-2 sm:px-3 rounded-lg font-semibold text-xs transition-colors active:scale-95 ${
                            tipoImovel === "barracao"
                              ? "bg-red-600 text-white"
                              : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                          }`}
                        >
                          Barracão
                        </button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs sm:text-sm font-semibold mb-2 block text-gray-800">
                        Área Construída (m²)
                      </Label>
                      <Input
                        type="number"
                        placeholder="Ex: 100"
                        value={area}
                        onChange={(e) => setArea(e.target.value)}
                        min="10"
                        max="10000"
                        className="h-10 text-sm border-gray-300 focus:border-red-500 rounded-lg"
                      />
                      <p className="text-xs text-gray-500 mt-1">
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
                        <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-2 sm:p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <CreditCard className="w-3 h-3 text-blue-600" />
                            <p className="text-xs text-gray-700 font-semibold">Cartão</p>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-blue-700">{formatBRL(resultadoCartao)}</p>
                        </div>
                        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-2 sm:p-3 text-center">
                          <div className="flex items-center justify-center gap-1 mb-1">
                            <Banknote className="w-3 h-3 text-green-600" />
                            <p className="text-xs text-gray-700 font-semibold">A Vista</p>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-green-700">{formatBRL(resultadoVista)}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button
                        onClick={calcularOrcamento}
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white h-10 text-sm font-semibold active:scale-95"
                      >
                        Calcular
                      </Button>
                      <Button
                        onClick={limpar}
                        variant="outline"
                        className="px-4 sm:px-5 h-10 text-sm font-semibold border-gray-300 hover:bg-gray-50 bg-transparent active:scale-95"
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Conteudo Principal */}
            <div className="flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Quando tem dessas baratinhas, precisa ser feito duas aplicações com intervalo de 15 dias, sendo a
                    primeira aplicação a pulverização e a segunda aplicação em gel. Pois na primeira aplicação mata as
                    que estão no local, e elas deixam ovinhos, esses ovinhos eclodem com 10 dias e nascem as ninfas.
                  </p>
                </div>

                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    A segunda aplicação é feita para matar as ninfas que nasceram das oocas, é feita após 15 dias pois
                    precisa ser feita antes que as ninfas fiquem adultas para não dar tempo de procriarem novamente. A
                    pulverização de baratona mata baratinha, mas a pulverização de baratinha não mata baratona, pois
                    para baratinha é necessário dois produtos, um desalojante e o outro que mata.
                  </p>
                </div>

                <div className="bg-white border-2 sm:border-4 border-black rounded-lg p-3 sm:p-4 shadow-sm">
                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                    Com a dedetização diminui bastante a ponto de não incomodar mais, pois acabar 100% não conseguimos.
                    Pois sempre há entrada e saída de alimentos e pessoas que podem servir de transporte para novas
                    baratinhas.
                  </p>
                </div>
              </div>

              <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 text-center">ORIENTAÇÕES</h2>

                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Gel:</strong> O gel que é feito após 15 dias, já está incluso no valor e ele fica
                      agendado, assim que agendamos a pulverização e ele não é feito por horário agendado e sim por
                      período, porque é feito por rota, então mandamos mensagem sempre 1 dia antes, para confirmar se
                      você vai estar no local naquele período (caso seja comércio, não confirmamos).
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Procedimento:</strong> Pulverizamos com bomba elétrica o rodapé de todo o local, dentro de
                      armários da cozinha e banheiros, e possíveis pontos de infestação como ralos, caixa de gordura e
                      grelhas.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Antes da Dedetização:</strong> E necessário retirar todos os itens dos armários da cozinha
                      e do banheiro para que possamos dedetizar essas áreas, onde geralmente há maior foco de
                      infestação.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Após a Dedetização:</strong> Você pode passar um pano úmido, mas a limpeza pesada deve ser
                      feita somente após 48 horas. Deixe uma janela ou porta aberta para permitir a circulação de ar e a
                      liberação dos gases tóxicos.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Afastamento:</strong> E necessario ficar fora do local de 4 a 6 horas. Gestantes, idosos,
                      animais de estimação e pessoas alérgicas a inseticidas devem ficar fora por 24 horas. Antes de
                      retornar, deixe portas e janelas abertas por 10 minutos para arejar o ambiente.
                    </p>
                  </div>

                  <div>
                    <p className="text-xs sm:text-sm text-gray-800 leading-relaxed">
                      <strong>Cuidados com Animais:</strong> Guarde TODOS os pertences dos animais, incluindo vasilhas
                      de água e ração, em locais seguros. Quando retornar com o animal, lave-o com água e sabão
                      corrente.
                    </p>
                  </div>

                  <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t-2 border-gray-200">
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
        </div>
      </main>
    </div>
  )
}


