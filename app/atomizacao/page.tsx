"use client"

import Link from "next/link"
import { ArrowLeft, TreePalm, Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackGuidanceCopied } from "@/lib/activity/client"

export default function AtomizacaoPage() {
  const [copied, setCopied] = useState(false)

  const precos1Funcionario = [
    { palmeiras: "1 a 3 Palmeiras", valor: "R$ 189,00", tempo: "1 hora" },
    { palmeiras: "4 a 5 Palmeiras", valor: "R$ 273,00", tempo: "1h30" },
    { palmeiras: "6 a 8 Palmeiras", valor: "R$ 336,00", tempo: "2 horas" },
    { palmeiras: "9 a 12 Palmeiras", valor: "R$ 399,00", tempo: "2 horas" },
    { palmeiras: "12 a 15 Palmeiras", valor: "R$ 472,50", tempo: "2h30" },
  ]

  const precos2Funcionarios = [
    { palmeiras: "1 a 3 Palmeiras", valor: "R$ 273,00", tempo: "1 hora" },
    { palmeiras: "4 a 5 Palmeiras", valor: "R$ 336,00", tempo: "1h30" },
    { palmeiras: "6 a 8 Palmeiras", valor: "R$ 441,00", tempo: "2 horas" },
    { palmeiras: "9 a 12 Palmeiras", valor: "R$ 567,00", tempo: "2 horas" },
    { palmeiras: "12 a 15 Palmeiras", valor: "R$ 1.008,00", tempo: "2h30" },
  ]

  const copiarTabela = () => {
    let texto = "ATOMIZAÇÃO MANDRUVA\n"
    texto += "VERIFICAR A DISPONIBILIDADE DO CARRO\n\n"
    texto += "1 FUNCIONÁRIO - PALMEIRAS ATÉ 2 METROS:\n"
    precos1Funcionario.forEach((p) => {
      texto += `${p.palmeiras} - ${p.valor} - ${p.tempo}\n`
    })
    texto += "\n2 FUNCIONÁRIOS - DE 2,5 A 7 METROS:\n"
    precos2Funcionarios.forEach((p) => {
      texto += `${p.palmeiras} - ${p.valor} - ${p.tempo}\n`
    })
    texto += "\nDesconto: 5% à vista"
    navigator.clipboard.writeText(texto)
    trackGuidanceCopied("Copiou tabela - Atomizacao")
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
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <TreePalm className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Atomização</h1>
              <p className="text-gray-600">Tratamento de palmeiras - Mandruva</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-green-500 text-white px-6 py-4">
              <h2 className="text-xl font-bold text-center">
                ATOMIZAÇÃO MANDRUVA, VERIFICAR A DISPONIBILIDADE DO CARRO
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th colSpan={3} className="px-4 py-2 text-center font-bold bg-pink-200 border-b border-r text-sm">
                      1 FUNCIONÁRIO - PALMEIRAS ATÉ 2 METROS
                    </th>
                    <th colSpan={2} className="px-4 py-2 text-center font-bold bg-pink-200 border-b border-r text-sm">
                      2 FUNCIONÁRIOS - DE 2,5 A 7 METROS
                    </th>
                    <th className="px-4 py-2 text-center font-bold bg-green-200 border-b text-sm">Desconto</th>
                  </tr>
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold bg-blue-100 border-b border-r text-xs">Qtd</th>
                    <th className="px-3 py-2 text-center font-semibold bg-yellow-100 border-b border-r text-xs">
                      Valor
                    </th>
                    <th className="px-3 py-2 text-center font-semibold bg-yellow-100 border-b border-r text-xs">
                      Tempo
                    </th>
                    <th className="px-3 py-2 text-center font-semibold bg-yellow-100 border-b border-r text-xs">
                      Valor
                    </th>
                    <th className="px-3 py-2 text-center font-semibold bg-yellow-100 border-b border-r text-xs">
                      Tempo
                    </th>
                    <th className="px-3 py-2 text-center font-semibold bg-green-100 border-b text-xs" rowSpan={6}>
                      5% vista
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {precos1Funcionario.map((preco, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 border-b border-r bg-blue-50 font-medium text-sm">{preco.palmeiras}</td>
                      <td className="px-3 py-2 border-b border-r bg-yellow-50 text-center font-semibold text-sm">
                        {preco.valor}
                      </td>
                      <td className="px-3 py-2 border-b border-r bg-yellow-50 text-center text-sm">{preco.tempo}</td>
                      <td className="px-3 py-2 border-b border-r bg-yellow-50 text-center font-semibold text-sm">
                        {precos2Funcionarios[index].valor}
                      </td>
                      <td className="px-3 py-2 border-b border-r bg-yellow-50 text-center text-sm">
                        {precos2Funcionarios[index].tempo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
