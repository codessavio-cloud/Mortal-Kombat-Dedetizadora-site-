"use client"

import Link from "next/link"
import { ArrowLeft, MessageCircle, Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackGuidanceCopied } from "@/lib/activity/client"

export default function FalasPage() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [copiedForm, setCopiedForm] = useState<string | null>(null)
  const [copiedAviso, setCopiedAviso] = useState(false)
  const [copiedPix, setCopiedPix] = useState(false)
  const [copiedBanco, setCopiedBanco] = useState(false)

  const falas = [
    { texto: "Qual a metragem do apartamento, por favor?", cor: "bg-blue-100 text-blue-800 border-blue-300" },
    { texto: "Está aparecendo alguma praga especifica no local?", cor: "bg-green-100 text-green-800 border-green-300" },
    {
      texto: "Ou seria apenas para os laudos da vigilância sanitária?",
      cor: "bg-purple-100 text-purple-800 border-purple-300",
    },
    { texto: "É residência ou comércio?", cor: "bg-orange-100 text-orange-800 border-orange-300" },
    {
      texto: "Para te passar o valor, preciso construída e do terreno e da área construída por favor",
      cor: "bg-cyan-100 text-cyan-800 border-cyan-300",
    },
    {
      texto: "São quantas caixas d'agua e qual a litragem por favor?",
      cor: "bg-pink-100 text-pink-800 border-pink-300",
    },
    {
      texto: "São quantos blocos de quantos andares por favor?",
      cor: "bg-yellow-100 text-yellow-800 border-yellow-300",
    },
    {
      texto: "os ratos, encontrou vestígios deles no local, como fezes urina ou coisa roídas?",
      cor: "bg-red-100 text-red-800 border-red-300",
    },
    {
      texto: "As aranhas são as grandes de jardim ou as que fazem teias nos cantos das paredes?",
      cor: "bg-indigo-100 text-indigo-800 border-indigo-300",
    },
  ]

  const formPessoaFisica = `Preciso dos dados para agendamento, por favor,
Nome completo: 
CPF: 
Data de nascimento: 
Endereço:
E-mail:
Forma de pagamento:`

  const formPessoaJuridica = `Preciso dos dados para agendamento, por favor,
CNPJ:
Endereço:
E-mail:
Forma de pagamento:`

  const avisoReagendamento = `🛑 Nosso atendimento é personalizado e dedicado para você cliente. Caso aconteça algum imprevisto e seja necessário um reagendamento, solicite o mesmo com 24h de antecedência. Em situações que o reagendamento seja feito com menos de 24hrs de antecedência será cobrado a taxa mínima no valor de R$52,50. 
🛑 Programe-se, siga o passo a passo das orientações pois controle de pragas é coisa séria!
😉 Agradecemos por sua confiança na Mortal Kombat 😃`

  const chavePix = `*CHAVE PIX* CNPJ 04.197.594/0001-23 Dedetizadora Mortal Kombat LTDA`

  const dadosBancarios = `Dados bancários:
Segue dados para depósito. 
Banco Bradesco 
Agencia 2234-9
Conta Corrente 19346-1

Banco Brasil 
Agencia 1001-4
Conta Corrente 18041-6

CNPJ 04.197.594/0001-23 *CHAVE PIX*
Dedetizadora Mortal Kombat LTDA`

  const copiarFala = (texto: string, index: number) => {
    navigator.clipboard.writeText(texto)
    trackGuidanceCopied("Copiou fala de atendimento")
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const copiarForm = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto)
    trackGuidanceCopied(`Copiou formulario - ${tipo}`)
    setCopiedForm(tipo)
    setTimeout(() => setCopiedForm(null), 2000)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium">Voltar para seleção de pragas</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Falas</h1>
              <p className="text-gray-600">Frases prontas para atendimento</p>
            </div>
          </div>

          {/* Perguntas para o Cliente */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Perguntas para o Cliente</h2>
            <div className="space-y-3">
              {falas.map((fala, index) => (
                <div
                  key={index}
                  className={`${fala.cor} border-2 rounded-xl p-4 flex items-center justify-between gap-4 cursor-pointer hover:opacity-80 transition-opacity`}
                  onClick={() => copiarFala(fala.texto, index)}
                >
                  <p className="font-medium text-sm">{fala.texto}</p>
                  <button className="flex-shrink-0">
                    {copiedIndex === index ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Aviso de Reagendamento */}
          <div className="bg-red-50 border-2 border-red-400 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg text-red-800 mb-3">Aviso de Reagendamento</h3>
            <p className="text-red-900 leading-relaxed whitespace-pre-line text-sm">{avisoReagendamento}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(avisoReagendamento)
                trackGuidanceCopied("Copiou aviso de reagendamento")
                setCopiedAviso(true)
                setTimeout(() => setCopiedAviso(false), 2000)
              }}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedAviso ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedAviso ? "COPIADO!" : "COPIAR AVISO"}
            </button>
          </div>

          {/* Chave PIX */}
          <div className="bg-green-50 border-2 border-green-400 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg text-green-800 mb-3">Chave PIX</h3>
            <p className="text-green-900 leading-relaxed text-sm font-semibold">{chavePix}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText("04.197.594/0001-23")
                trackGuidanceCopied("Copiou chave PIX")
                setCopiedPix(true)
                setTimeout(() => setCopiedPix(false), 2000)
              }}
              className="mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedPix ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedPix ? "COPIADO!" : "COPIAR CNPJ/PIX"}
            </button>
          </div>

          {/* Dados Bancários */}
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg text-blue-800 mb-3">Dados Bancários</h3>
            <pre className="text-blue-900 leading-relaxed text-sm whitespace-pre-wrap font-sans">{dadosBancarios}</pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(dadosBancarios)
                trackGuidanceCopied("Copiou dados bancarios")
                setCopiedBanco(true)
                setTimeout(() => setCopiedBanco(false), 2000)
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedBanco ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedBanco ? "COPIADO!" : "COPIAR DADOS BANCÁRIOS"}
            </button>
          </div>

          {/* Formulários de dados */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Pessoa Física */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-blue-600 text-white px-6 py-4">
                <h2 className="text-lg font-bold text-center">Caso feche Pessoa Física</h2>
              </div>
              <div className="p-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {formPessoaFisica}
                </pre>
                <button
                  onClick={() => copiarForm(formPessoaFisica, "fisica")}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {copiedForm === "fisica" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copiedForm === "fisica" ? "COPIADO!" : "COPIAR"}
                </button>
              </div>
            </div>

            {/* Pessoa Jurídica */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-green-600 text-white px-6 py-4">
                <h2 className="text-lg font-bold text-center">Caso feche Pessoa Jurídica</h2>
              </div>
              <div className="p-6">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed bg-gray-50 p-4 rounded-lg">
                  {formPessoaJuridica}
                </pre>
                <button
                  onClick={() => copiarForm(formPessoaJuridica, "juridica")}
                  className="w-full mt-4 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {copiedForm === "juridica" ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  {copiedForm === "juridica" ? "COPIADO!" : "COPIAR"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
