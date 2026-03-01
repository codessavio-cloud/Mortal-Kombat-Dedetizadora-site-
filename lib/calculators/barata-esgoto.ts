import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

export const BARATA_ESGOTO_CONDOMINIO_PRICING = {
  1: {
    4: { cartao: 220, vista: 200, funcionarios: 1, horas: 1 },
    10: { cartao: 300, vista: 280, funcionarios: 2, horas: 1 },
    15: { cartao: 350, vista: 330, funcionarios: 2, horas: 1 },
    20: { cartao: 420, vista: 400, funcionarios: 2, horas: 1.5 },
    25: { cartao: 580, vista: 550, funcionarios: 2, horas: 2 },
    30: { cartao: 750, vista: 730, funcionarios: 2, horas: 2.5 },
    40: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
  },
  2: {
    4: { cartao: 300, vista: 280, funcionarios: 2, horas: 1 },
    10: { cartao: 420, vista: 400, funcionarios: 2, horas: 1.5 },
    15: { cartao: 500, vista: 480, funcionarios: 2, horas: 1.67 },
    20: { cartao: 600, vista: 580, funcionarios: 2, horas: 2 },
    25: { cartao: 750, vista: 720, funcionarios: 2, horas: 2.5 },
    30: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
    40: { cartao: 1200, vista: 1140, funcionarios: 2, horas: 4 },
  },
  3: {
    4: { cartao: 350, vista: 330, funcionarios: 2, horas: 2.5 },
    10: { cartao: 600, vista: 580, funcionarios: 2, horas: 2 },
    15: { cartao: 750, vista: 720, funcionarios: 2, horas: 2.5 },
    20: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
  },
  4: {
    4: { cartao: 420, vista: 400, funcionarios: 2, horas: 1.5 },
    10: { cartao: 750, vista: 720, funcionarios: 2, horas: 2.5 },
    15: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
    20: { cartao: 1050, vista: 1000, funcionarios: 2, horas: 3.5 },
  },
  5: {
    4: { cartao: 470, vista: 450, funcionarios: 2, horas: 1.67 },
    10: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
    15: { cartao: 1050, vista: 1000, funcionarios: 2, horas: 3.5 },
    20: { cartao: 1200, vista: 1160, funcionarios: 2, horas: 4 },
  },
  6: {
    4: { cartao: 600, vista: 580, funcionarios: 2, horas: 2 },
    10: { cartao: 1050, vista: 1000, funcionarios: 2, horas: 3.5 },
  },
  7: {
    4: { cartao: 600, vista: 580, funcionarios: 2, horas: 2 },
    10: { cartao: 1050, vista: 1000, funcionarios: 2, horas: 3.5 },
  },
  8: {
    4: { cartao: 750, vista: 720, funcionarios: 2, horas: 2.5 },
    10: { cartao: 1200, vista: 1140, funcionarios: 2, horas: 4 },
  },
  9: {
    4: { cartao: 750, vista: 720, funcionarios: 2, horas: 2.5 },
    10: { cartao: 1200, vista: 1140, funcionarios: 2, horas: 4 },
  },
  10: {
    4: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
    10: { cartao: 1350, vista: 1310, funcionarios: 2, horas: 4.5 },
  },
  11: {
    4: { cartao: 840, vista: 800, funcionarios: 2, horas: 3 },
    10: { cartao: 1350, vista: 1310, funcionarios: 2, horas: 4.5 },
  },
}

const PRICING_TIERS = {
  apartamento: [
    { area: 100, cartao: 170, vista: 150 },
    { area: 200, cartao: 220, vista: 200 },
    { area: 300, cartao: 270, vista: 250 },
    { area: 400, cartao: 320, vista: 300 },
  ],
  casa: [
    { area: 150, cartao: 220, vista: 200 },
    { area: 300, cartao: 280, vista: 260 },
    { area: 400, cartao: 350, vista: 330 },
    { area: 500, cartao: 450, vista: 430 },
  ],
}

const COMERCIO_BARRACAO_PRICING = [
  { min: 0, max: 150, cartao: 170, vista: 150 },
  { min: 151, max: 300, cartao: 230, vista: 210 },
  { min: 301, max: 399, cartao: 270, vista: 250 },
  { min: 400, max: 499, cartao: 300, vista: 280 },
  { min: 500, max: 599, cartao: 350, vista: 330 },
  { min: 600, max: 699, cartao: 400, vista: 380 },
  { min: 700, max: 799, cartao: 450, vista: 430 },
  { min: 800, max: 899, cartao: 500, vista: 480 },
  { min: 900, max: 999, cartao: 550, vista: 530 },
  { min: 1000, max: 1099, cartao: 600, vista: 580 },
  { min: 1100, max: 1199, cartao: 650, vista: 630 },
  { min: 1200, max: 1299, cartao: 700, vista: 680 },
  { min: 1300, max: 1399, cartao: 750, vista: 730 },
  { min: 1400, max: 1499, cartao: 800, vista: 780 },
  { min: 1500, max: 1599, cartao: 850, vista: 830 },
  { min: 1600, max: 1699, cartao: 900, vista: 880 },
  { min: 1700, max: 1799, cartao: 950, vista: 930 },
  { min: 1800, max: 1899, cartao: 1000, vista: 980 },
  { min: 1900, max: 2000, cartao: 1100, vista: 1080 },
]

export function findClosestFloorRange(andares: number, availableRanges: number[]) {
  if (availableRanges.length === 0) return 0

  const sortedRanges = [...availableRanges].sort((a, b) => a - b)
  for (const range of sortedRanges) {
    if (andares <= range) return range
  }

  return sortedRanges[sortedRanges.length - 1]
}

export function calculateBarataEsgotoPrice(area: number, tipoImovel: string) {
  if (tipoImovel === "comercio" || tipoImovel === "barracao") {
    const faixa = COMERCIO_BARRACAO_PRICING.find((item) => area >= item.min && area <= item.max)
    if (!faixa) return null
    return {
      cartao: applyPriceIncrease(faixa.cartao),
      vista: applyPriceIncrease(faixa.vista),
    }
  }

  const tiers = PRICING_TIERS[tipoImovel as keyof typeof PRICING_TIERS]
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
  const additionalCost = blocksOf100 * 80

  return {
    cartao: applyPriceIncrease(lastTier.cartao + additionalCost),
    vista: applyPriceIncrease(lastTier.vista + additionalCost),
  }
}

export function formatHours(hours: number) {
  if (hours === Math.floor(hours)) {
    return `${hours}h`
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return minutes > 0 ? `${wholeHours}h ${minutes}min` : `${wholeHours}h`
}
