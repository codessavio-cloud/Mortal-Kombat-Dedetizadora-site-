"use client"

import Link from "next/link"
import { ArrowLeft, Droplets, Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackGuidanceCopied } from "@/lib/activity/client"

export default function CaixaDaguaPage() {
  const [copied, setCopied] = useState(false)
  const [copiedFala, setCopiedFala] = useState(false)

  const precosComDedetizacao = [
    { litragem: "500lts até 1.500lts", cartao: "R$ 260,00", vista: "R$ 240,00" },
    { litragem: "2.000lts até 5.000lts", cartao: "R$ 370,00", vista: "R$ 350,00" },
    { litragem: "6.000lts até 10.000lts", cartao: "R$ 500,00", vista: "R$ 480,00" },
    { litragem: "11.000lts até 15.000lts", cartao: "R$ 620,00", vista: "R$ 600,00" },
    { litragem: "16.000lts até 20.000lts", cartao: "R$ 680,00", vista: "R$ 660,00" },
    { litragem: "21.000lts até 30.000lts", cartao: "R$ 800,00", vista: "R$ 780,00" },
    { litragem: "31.000lts até 40.000lts", cartao: "R$ 910,00", vista: "R$ 890,00" },
    { litragem: "41.000lts até 50.000lts", cartao: "R$ 970,00", vista: "R$ 950,00" },
  ]

  const precosSemDedetizacao = [
    { litragem: "500lts até 1.500lts", cartao: "R$ 300,00", vista: "R$ 280,00" },
    { litragem: "2.000lts até 5.000lts", cartao: "R$ 400,00", vista: "R$ 380,00" },
    { litragem: "6.000lts até 10.000lts", cartao: "R$ 550,00", vista: "R$ 530,00" },
    { litragem: "11.000lts até 15.000lts", cartao: "R$ 650,00", vista: "R$ 630,00" },
    { litragem: "16.000lts até 20.000lts", cartao: "R$ 760,00", vista: "R$ 740,00" },
  ]

  const falaLimpeza = `Durante a limpeza da caixa d'água 💧, por favor, evite usar a água dela, pois isso pode causar problemas como a entrada de ar no encanamento 🔧, o que pode levar a danos ou falta de água. 🚫💦
Aguarde pelo menos 1 hora⏳ após o serviço antes de utilizar a água novamente.`

  const copiarFalaLimpeza = () => {
    navigator.clipboard.writeText(falaLimpeza)
    trackGuidanceCopied("Copiou orientacoes - Caixa d'agua")
    setCopiedFala(true)
    setTimeout(() => setCopiedFala(false), 2000)
  }

  const copiarTabela = () => {
    let texto = "VALORES CAIXA D'ÁGUA 2025\n\n"
    texto += "COM DEDETIZAÇÃO:\n"
    precosComDedetizacao.forEach((p) => {
      texto += `${p.litragem} - ${p.cartao} (cartão) / ${p.vista} (vista)\n`
    })
    texto += "\nSEM DEDETIZAÇÃO:\n"
    precosSemDedetizacao.forEach((p) => {
      texto += `${p.litragem} - ${p.cartao} (cartão) / ${p.vista} (vista)\n`
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
              <h2 className="text-xl font-bold text-center">Valores das caixas d'água 2025 - com dedetização</h2>
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
                {precosComDedetizacao.map((preco, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 border-b font-medium">{preco.litragem}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-blue-600">{preco.cartao}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-green-600">{preco.vista}</td>
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
              <h2 className="text-xl font-bold text-center">Valores das caixas d'água 2025 - sem dedetização</h2>
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
                {precosSemDedetizacao.map((preco, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-6 py-3 border-b font-medium">{preco.litragem}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-blue-600">{preco.cartao}</td>
                    <td className="px-6 py-3 border-b text-center font-semibold text-green-600">{preco.vista}</td>
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
