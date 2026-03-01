import { describe, expect, it } from "vitest"

import { calculateBaratinhaPrice } from "@/lib/calculators/baratinha"

describe("calculateBaratinhaPrice", () => {
  it("aplica aumento de 5% na faixa base", () => {
    const result = calculateBaratinhaPrice(100, "apartamento")

    expect(result).toEqual({
      cartao: 295,
      vista: 275,
    })
  })

  it("calcula acrescimo para area acima da ultima faixa", () => {
    const result = calculateBaratinhaPrice(550, "casa")

    expect(result).toEqual({
      cartao: 650,
      vista: 630,
    })
  })

  it("retorna null para tipo de imovel invalido", () => {
    expect(calculateBaratinhaPrice(100, "loja")).toBeNull()
  })
})
