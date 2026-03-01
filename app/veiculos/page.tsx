"use client"

import Link from "next/link"
import { ArrowLeft, Car, Copy, Check } from "lucide-react"
import { useState } from "react"
import { trackGuidanceCopied } from "@/lib/activity/client"

export default function VeiculosPage() {
  const [copied, setCopied] = useState(false)

  const precos = [
    { quantidade: "Se for até dois veículos", esgoto: "R$ 126,00", baratinhas: "R$ 231,00", desconto: "não tem" },
    { quantidade: "De 3 a 5 veículos", esgoto: "R$ 115,50", baratinhas: "R$ 210,00", desconto: "" },
    { quantidade: "De 5 a 15 veículos", esgoto: "R$ 94,50", baratinhas: "R$ 168,00", desconto: "a vista 5%" },
    { quantidade: "De 15 a 25 veículos", esgoto: "R$ 84,00", baratinhas: "R$ 157,50", desconto: "" },
    { quantidade: "De 25 a 40 veículos", esgoto: "R$ 63,00", baratinhas: "R$ 105,00", desconto: "" },
  ]

  const copiarTabela = () => {
    let texto = "VEÍCULO - DEDETIZAÇÃO\n\n"
    precos.forEach((p) => {
      texto += `${p.quantidade}\n`
      texto += `  Baratas de esgoto: ${p.esgoto}\n`
      texto += `  Baratinhas: ${p.baratinhas}\n`
      if (p.desconto) texto += `  Desconto: ${p.desconto}\n`
      texto += "\n"
    })
    navigator.clipboard.writeText(texto)
    trackGuidanceCopied("Copiou tabela - Veiculos")
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
            <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center">
              <Car className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Veículos</h1>
              <p className="text-gray-600">Dedetização de veículos</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
            <div className="bg-blue-200 text-gray-900 px-6 py-4">
              <h2 className="text-xl font-bold text-center">Veículo - Dedetização</h2>
            </div>
            <table className="w-full">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-semibold bg-blue-100 border-b border-r">Quantidade</th>
                  <th className="px-4 py-3 text-center font-semibold bg-yellow-100 border-b border-r">
                    Baratas de Esgoto
                  </th>
                  <th className="px-4 py-3 text-center font-semibold bg-yellow-100 border-b border-r">Baratinhas</th>
                  <th className="px-4 py-3 text-center font-semibold bg-green-100 border-b">Desconto</th>
                </tr>
              </thead>
              <tbody>
                {precos.map((preco, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 border-b border-r bg-blue-50 font-medium">{preco.quantidade}</td>
                    <td className="px-4 py-3 border-b border-r bg-yellow-50 text-center font-semibold">
                      {preco.esgoto}
                    </td>
                    <td className="px-4 py-3 border-b border-r bg-yellow-50 text-center font-semibold">
                      {preco.baratinhas}
                    </td>
                    <td className="px-4 py-3 border-b bg-green-50 text-center font-semibold text-green-700">
                      {preco.desconto}
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
