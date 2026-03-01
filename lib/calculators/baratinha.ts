import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

export const BARATINHA_PRICING_TIERS = {
  apartamento: [
    { area: 100, cartao: 280, vista: 260 },
    { area: 200, cartao: 320, vista: 300 },
    { area: 300, cartao: 390, vista: 370 },
    { area: 400, cartao: 430, vista: 410 },
  ],
  casa: [
    { area: 150, cartao: 320, vista: 300 },
    { area: 300, cartao: 390, vista: 370 },
    { area: 400, cartao: 450, vista: 430 },
    { area: 500, cartao: 560, vista: 540 },
  ],
  comercio: [
    { area: 150, cartao: 280, vista: 260 },
    { area: 300, cartao: 350, vista: 330 },
    { area: 400, cartao: 420, vista: 400 },
    { area: 500, cartao: 520, vista: 500 },
  ],
  barracao: [
    { area: 150, cartao: 280, vista: 260 },
    { area: 300, cartao: 350, vista: 330 },
    { area: 400, cartao: 420, vista: 400 },
    { area: 500, cartao: 520, vista: 500 },
  ],
}

export function calculateBaratinhaPrice(area: number, tipoImovel: string) {
  const tiers = BARATINHA_PRICING_TIERS[tipoImovel as keyof typeof BARATINHA_PRICING_TIERS]
  if (!tiers) return null

  for (const tier of tiers) {
    if (area <= tier.area) {
      return {
        cartao: applyPriceIncrease(tier.cartao),
        vista: applyPriceIncrease(tier.vista),
      }
    }
  }

  const lastTier = tiers[tiers.length - 1]
  const excessArea = area - lastTier.area
  const blocksOf100 = Math.ceil(excessArea / 100)
  const additionalCost = blocksOf100 * 60

  return {
    cartao: applyPriceIncrease(lastTier.cartao + additionalCost),
    vista: applyPriceIncrease(lastTier.vista + additionalCost),
  }
}
