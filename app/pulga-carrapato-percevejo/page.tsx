"use client"

import { useState, useEffect, useCallback } from "react"
import { Copy, Check, ArrowLeft, CreditCard, Banknote, AlertCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { trackBudgetCalculated, trackGuidanceCopied } from "@/lib/activity/client"
import { calculatePulgaCarrapatoPercevejoPrice } from "@/lib/calculators/pulga-carrapato-percevejo"

export default function PulgaCarrapatoPercevejoPage() {
  const [copied, setCopied] = useState(false)
  const [tipoImovel, setTipoImovel] = useState("")
  const [area, setArea] = useState("")
  const [resultadoCartao, setResultadoCartao] = useState<number | null>(null)
  const [resultadoVista, setResultadoVista] = useState<number | null>(null)
  const [erro, setErro] = useState("")

  const infoTexto = `PULGA, CARRAPATO E PERCEVEJO - Informacoes Importantes

-------------------------------------------------------
CARRAPATOS E PULGAS - IMPORTANTE
-------------------------------------------------------
- Para carrapatos e pulgas fazemos 03 aplicacoes com intervalo de 07 dias cada.
- E necessario que o animal de estimacao tome o medicamento Nexgard ou outro indicado pelo veterinario antes de comecar o tratamento, para que possamos oferecer 03 meses de garantia.
- Caso tenha chao de terra no local, e necessario molhar com 30 minutos de antecedencia para melhor absorcao do produto.
- Seguir as instrucoes de afastamento enviadas no fechamento, validas para os 03 dias de aplicacao.
Procedimento: Pulverizacao completa com atencao especial a frestas, rodapes, camas, sofas e areas onde os animais costumam ficar.

Antes:
- Lavar todos os tecidos (roupas de cama, capas de sofa, cortinas).
- Aspirar carpetes e estofados.
- Afastar moveis das paredes, se possivel.

Apos:
- Pano umido ok, limpeza pesada so apos 48h.
- Nao lavar os locais tratados imediatamente.

Afastamento: 4-6 horas (24h para gestantes, alergicos e animais).

Cuidados com animais:
- Guardar pertences dos pets.
- Lavar vasilhas ao retornar.
- Recomenda-se tratamento veterinario dos animais em paralelo.

Garantia: 3 meses (com tratamento veterinario dos animais).

-------------------------------------------------------
PERCEVEJO DE CAMA - IMPORTANTE
-------------------------------------------------------
- Para percevejo fazemos 03 aplicacoes com intervalo de 07 dias cada.
- E necessario retirar todas as roupas de cama e toalhas para lavar ANTES da dedetizacao, para que possamos dedetizar os colchoes adequadamente.
Procedimento: Pulverizacao focada em colchoes, estrados, frestas de camas, moveis proximos e rodapes.

Antes:
- Retirar TODAS as roupas de cama e toalhas.
- Lavar todos os tecidos em agua quente.
- Expor colchoes para tratamento.
- Afastar moveis das paredes.

Apos:
- Aguardar secagem completa antes de recolocar roupas de cama.
- Pano umido ok, limpeza pesada so apos 48h.
- Nao lavar os locais tratados imediatamente.

Afastamento: 4-6 horas (24h para gestantes, alergicos e animais).
Garantia: 3 meses.
Observacao: O tratamento deve ser feito em todos os comodos onde ha suspeita de infestacao.`

  const copiarTexto = () => {
    navigator.clipboard.writeText(infoTexto)
    trackGuidanceCopied("Copiou orientacoes - Pulga/Carrapato/Percevejo")
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

    const pricing = calculatePulgaCarrapatoPercevejoPrice(areaNum, tipoImovel)
    if (!pricing) {
      setErro("Erro ao calcular o preco. Entre em contato para orcamento personalizado")
      return
    }

    setResultadoCartao(pricing.cartao)
    setResultadoVista(pricing.vista)
    trackBudgetCalculated(`Calculou Pulga/Carrapato/Percevejo (${tipoImovel}) - ${areaNum}m2`)
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
    <div className="min-h-[100dvh] flex flex-col bg-white overflow-x-hidden">
      <header className="bg-white border-b border-gray-200 shadow-sm py-2 md:py-3 flex-shrink-0">
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
        <div className="flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-4">
          <aside className="w-full lg:w-[350px] flex-shrink-0 bg-white rounded-lg border-2 border-gray-200 p-3 md:p-4">
            <div className="flex items-center gap-2 md:gap-3 mb-4 md:mb-6">
              <div className="bg-red-50 rounded-lg p-1.5 md:p-2 border border-red-200">
                <Image
                  src="/images/pests/pulga-carrapato-percevejo-illustration.jpg"
                  alt="Pulga, Carrapato e Percevejo"
                  width={50}
                  height={50}
                  className="rounded w-10 h-10 md:w-[60px] md:h-[60px]"
                />
              </div>
              <div>
                <h1 className="text-base md:text-xl font-bold text-gray-900">Pulga, Carrapato e Percevejo</h1>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              <h2 className="text-base md:text-lg font-bold text-gray-900">Calculadora de Orçamento</h2>
              <p className="text-xs md:text-sm text-gray-600">Preencha os dados para calcular</p>

              <div>
                <Label className="text-xs md:text-sm font-semibold mb-2 block">Tipo de Imóvel</Label>
                <div className="grid grid-cols-2 gap-2">
                  {["Casa", "Apartamento", "Comércio", "Barracão"].map((tipo) => (
                    <button
                      key={tipo}
                      onClick={() => setTipoImovel(tipo.toLowerCase())}
                      className={`py-2 px-3 rounded-lg text-xs md:text-sm font-medium transition-all active:scale-95 ${
                        tipoImovel === tipo.toLowerCase()
                          ? "bg-red-600 text-white"
                          : "bg-white border border-gray-300 text-gray-700 hover:border-red-400"
                      }`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-xs md:text-sm font-semibold mb-2 block">Área Construída (m²)</Label>
                <Input
                  type="number"
                  placeholder="Ex: 100"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="h-9 md:h-10"
                />
                <p className="text-[10px] md:text-xs text-gray-500 mt-1">* Considere apenas a área construída</p>
              </div>

              {erro && (
                <div className="bg-red-50 border border-red-300 rounded-lg p-2 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 font-medium">{erro}</p>
                </div>
              )}

              {resultadoCartao !== null && resultadoVista !== null && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-blue-50 border border-blue-400 rounded-lg p-2 md:p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CreditCard className="w-3 h-3 text-blue-600" />
                      <p className="text-[10px] md:text-xs text-gray-700 font-semibold">Cartão</p>
                    </div>
                    <p className="text-base md:text-lg font-bold text-blue-700">R$ {resultadoCartao.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 border border-green-400 rounded-lg p-2 md:p-3 text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Banknote className="w-3 h-3 text-green-600" />
                      <p className="text-[10px] md:text-xs text-gray-700 font-semibold">A Vista</p>
                    </div>
                    <p className="text-base md:text-lg font-bold text-green-700">R$ {resultadoVista.toFixed(2)}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={calcularOrcamento}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-9 md:h-10 text-sm active:scale-95"
                >
                  Calcular
                </Button>
                <Button
                  onClick={limpar}
                  variant="outline"
                  className="px-3 md:px-4 h-9 md:h-10 text-sm bg-transparent active:scale-95"
                >
                  Limpar
                </Button>
              </div>
            </div>
          </aside>

          <div className="flex-1 flex flex-col gap-2 md:gap-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-3 flex-shrink-0">
              <div className="bg-white border-2 md:border-4 border-black rounded-xl p-3 md:p-4">
                <h3 className="font-bold text-xs md:text-sm mb-2">Carrapatos e Pulgas</h3>
                <p className="text-[10px] md:text-xs leading-relaxed">
                  03 aplicações com intervalo de 07 dias cada para eliminar todos os estágios de vida do parasita.
                </p>
              </div>

              <div className="bg-white border-2 md:border-4 border-black rounded-xl p-3 md:p-4">
                <h3 className="font-bold text-xs md:text-sm mb-2">Medicamento Obrigatório</h3>
                <p className="text-[10px] md:text-xs leading-relaxed">
                  Animal deve tomar Nexgard ou similar ANTES do tratamento para garantia de 3 meses.
                </p>
              </div>

              <div className="bg-white border-2 md:border-4 border-black rounded-xl p-3 md:p-4">
                <h3 className="font-bold text-xs md:text-sm mb-2">Percevejo de Cama</h3>
                <p className="text-[10px] md:text-xs leading-relaxed">
                  03 aplicações com intervalo de 07 dias. Retirar TODAS as roupas de cama antes.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-gray-50 rounded-xl p-3 md:p-4 border border-gray-200">
              <h2 className="text-lg md:text-xl font-bold text-center mb-3 md:mb-4">ORIENTACOES</h2>
              <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                <p className="leading-relaxed">
                  <strong>Antes:</strong> Guardar roupas de cama e toalhas. Para chão de terra, molhar 30 min antes.
                </p>
                <p className="leading-relaxed">
                  <strong>Após:</strong> Pano úmido ok, limpeza pesada só após 48h.
                </p>
                <p className="leading-relaxed">
                  <strong>Afastamento:</strong> 4-6h (24h para gestantes, alérgicos e animais).
                </p>
                <p className="leading-relaxed">
                  <strong>Animais:</strong> Guardar pertences, lavar com água e sabão ao retornar.
                </p>
                <p className="leading-relaxed">
                  <strong>Garantia:</strong> 3 meses (com tratamento veterinário).
                </p>

                <div className="mt-3 md:mt-4">
                  <Button
                    onClick={copiarTexto}
                    className="w-full bg-green-600 hover:bg-green-700 text-white h-9 md:h-10 text-sm font-semibold active:scale-95"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        COPIADO!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                        COPIAR TEXTO
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

