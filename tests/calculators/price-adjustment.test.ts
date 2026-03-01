import { describe, expect, it } from "vitest"

import { applyPriceIncrease, formatBRL } from "@/lib/calculators/price-adjustment"

describe("price-adjustment", () => {
  it("aplica aumento de 5% e arredonda para multiplo de 5", () => {
    expect(applyPriceIncrease(170)).toBe(180)
    expect(applyPriceIncrease(420)).toBe(440)
  })

  it("retorna 0 para entradas invalidas ou negativas", () => {
    expect(applyPriceIncrease(Number.NaN)).toBe(0)
    expect(applyPriceIncrease(Number.POSITIVE_INFINITY)).toBe(0)
    expect(applyPriceIncrease(-10)).toBe(0)
  })

  it("formata moeda sem centavos e em multiplo de 5", () => {
    expect(formatBRL(179)).toBe("R$ 180")
    expect(formatBRL(1050)).toBe("R$ 1.050")
    expect(formatBRL(Number.NaN)).toBe("R$ 0")
  })
})
