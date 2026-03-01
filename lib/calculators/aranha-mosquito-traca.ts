import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

function calculateTieredPrice(
  area: number,
  tiers: Array<{ max: number; cartao: number; vista: number }>,
) {
  const tier = tiers.find((item) => area <= item.max)
  if (tier) {
    return {
      cartao: applyPriceIncrease(tier.cartao),
      vista: applyPriceIncrease(tier.vista),
    }
  }

  const lastTier = tiers[tiers.length - 1]
  const excessArea = area - lastTier.max
  const blocksOf100 = Math.ceil(excessArea / 100)
  const additionalCost = blocksOf100 * 60

  return {
    cartao: applyPriceIncrease(lastTier.cartao + additionalCost),
    vista: applyPriceIncrease(lastTier.vista + additionalCost),
  }
}

export function calculateAranhaMosquitoTracaPrice(area: number, tipoImovel: string) {
  if (tipoImovel === "apartamento") {
    return calculateTieredPrice(area, [
      { max: 100, cartao: 220, vista: 200 },
      { max: 200, cartao: 270, vista: 250 },
      { max: 300, cartao: 320, vista: 300 },
      { max: 400, cartao: 370, vista: 350 },
    ])
  }

  if (tipoImovel === "casa") {
    return calculateTieredPrice(area, [
      { max: 150, cartao: 270, vista: 250 },
      { max: 300, cartao: 340, vista: 320 },
      { max: 400, cartao: 400, vista: 380 },
      { max: 500, cartao: 480, vista: 460 },
    ])
  }

  if (tipoImovel === "comercio") {
    return calculateTieredPrice(area, [
      { max: 150, cartao: 220, vista: 200 },
      { max: 300, cartao: 270, vista: 250 },
      { max: 400, cartao: 340, vista: 320 },
      { max: 500, cartao: 420, vista: 400 },
    ])
  }

  if (tipoImovel === "barracao") {
    return calculateTieredPrice(area, [
      { max: 150, cartao: 220, vista: 200 },
      { max: 300, cartao: 270, vista: 250 },
      { max: 400, cartao: 320, vista: 300 },
      { max: 500, cartao: 380, vista: 360 },
    ])
  }

  return null
}
