"use client"

import Link from "next/link"
import { ArrowLeft, Droplets, Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackGuidanceCopied } from "@/lib/activity/client"
import { formatBRL } from "@/lib/calculators/price-adjustment"
import {
  ANO_CAIXA_DAGUA,
  PRECOS_CAIXA_DAGUA_COM_DEDETIZACAO,
  PRECOS_CAIXA_DAGUA_SEM_DEDETIZACAO,
} from "@/lib/static-service-pricing"

export default function CaixaDaguaPage() {
  const [copied, setCopied] = useState(false)
  const [copiedFala, setCopiedFala] = useState(false)

  const falaLimpeza = `Durante a limpeza da caixa d'água 💧, por favor, evite usar a água dela, pois isso pode causar problemas como a entrada de ar no encanamento 🔧, o que pode levar a danos ou falta de água. 🚫💦
Aguarde pelo menos 1 hora⏳ após o serviço antes de utilizar a água novamente.`

  const copiarFalaLimpeza = () => {
    navigator.clipboard.writeText(falaLimpeza)
    trackGuidanceCopied("Copiou orientacoes - Caixa d'agua")
    setCopiedFala(true)
    setTimeout(() => setCopiedFala(false), 2000)
  }

  const copiarTabela = () => {
    let texto = `VALORES CAIXA D'ÁGUA ${ANO_CAIXA_DAGUA}\n\n`
    texto += "COM DEDETIZAÇÃO:\n"
    PRECOS_CAIXA_DAGUA_COM_DEDETIZACAO.forEach((p) => {
      texto += `${p.label} - ${formatBRL(p.cartao)} (cartão) / ${formatBRL(p.vista)} (vista)\n`
    })
    texto += "\nSEM DEDETIZAÇÃO:\n"
    PRECOS_CAIXA_DAGUA_SEM_DEDETIZACAO.forEach((p) => {
      texto += `${p.label} - ${formatBRL(p.cartao)} (cartão) / ${formatBRL(p.vista)} (vista)\n`
    })
    navigator.clipboard.writeText(texto)
    trackGuidanceCopied("Copiou tabela - Caixa d'agua")
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
            <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center">
              <Droplets className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Caixa d'Água</h1>
              <p className="text-gray-600">Limpeza e higienização de caixas d'água</p>
            </div>
          </div>

          {/* Orientações para o Cliente */}
          <div className="bg-cyan-50 border-2 border-cyan-400 rounded-xl p-6 mb-6">
            <h3 className="font-bold text-lg text-cyan-800 mb-3 flex items-center gap-2">
              <span className="text-2xl">💧</span> Orientações para o Cliente
            </h3>
            <p className="text-cyan-900 leading-relaxed whitespace-pre-line text-sm">{falaLimpeza}</p>
            <button
              onClick={copiarFalaLimpeza}
              className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
            >
              {copiedFala ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedFala ? "COPIADO!" : "COPIAR FALA"}
            </button>
          </div>

          {/* Tabela COM Dedetização */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gray-900 text-white px-6 py-4">
              <h2 className="text-xl font-bold text-center">
                Valores das caixas d'água {ANO_CAIXA_DAGUA} - com dedetização
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 border-b">Litragem</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 border-b">Cartão (P)</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 border-b">À Vista (V)</th>
                </tr>
              </thead>
              <tbody>
                {PRECOS_CAIXA_DAGUA_COM_DEDETIZACAO.map((preco, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 border-b font-medium">{preco.label}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-blue-600">
                      {formatBRL(preco.cartao)}
                    </td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-green-600">
                      {formatBRL(preco.vista)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Divisor amarelo */}
          <div className="h-2 bg-yellow-400 rounded-full mb-6"></div>

          {/* Tabela SEM Dedetização */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-gray-900 text-white px-6 py-4">
              <h2 className="text-xl font-bold text-center">
                Valores das caixas d'água {ANO_CAIXA_DAGUA} - sem dedetização
              </h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold text-gray-700 border-b">Litragem</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 border-b">Cartão (P)</th>
                  <th className="px-6 py-3 text-center font-semibold text-gray-700 border-b">À Vista (V)</th>
                </tr>
              </thead>
              <tbody>
                {PRECOS_CAIXA_DAGUA_SEM_DEDETIZACAO.map((preco, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 border-b font-medium">{preco.label}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-blue-600">
                      {formatBRL(preco.cartao)}
                    </td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-green-600">
                      {formatBRL(preco.vista)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            onClick={copiarTabela}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            {copied ? "COPIADO!" : "COPIAR TABELA"}
          </button>
        </div>
      </main>
    </div>
  )
}
