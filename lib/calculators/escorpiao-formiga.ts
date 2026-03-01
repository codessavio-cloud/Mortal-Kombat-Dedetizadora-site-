import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

type ComboCondominioPrice = {
  cartao: number
  vista: number
  funcionarios: number
  horas: number
}

type ComboTierPrice = {
  max: number
  cartao: number
  vista: number
}

export const COMBO_CONDOMINIO_PRECOS = {
  1: {
    4: { cartao: 330, vista: 310, funcionarios: 1, horas: 1 },
    10: { cartao: 430, vista: 400, funcionarios: 2, horas: 1 },
    15: { cartao: 480, vista: 460, funcionarios: 2, horas: 1.5 },
    20: { cartao: 630, vista: 610, funcionarios: 2, horas: 1.5 },
    25: { cartao: 870, vista: 830, funcionarios: 2, horas: 2 },
    30: { cartao: 1090, vista: 1050, funcionarios: 2, horas: 2.5 },
    40: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
  },
  2: {
    4: { cartao: 420, vista: 400, funcionarios: 2, horas: 1 },
    10: { cartao: 630, vista: 610, funcionarios: 2, horas: 1.5 },
    15: { cartao: 750, vista: 730, funcionarios: 2, horas: 1.67 },
    20: { cartao: 900, vista: 870, funcionarios: 2, horas: 2 },
    25: { cartao: 1050, vista: 1010, funcionarios: 2, horas: 2.5 },
    30: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
    40: { cartao: 1800, vista: 1760, funcionarios: 2, horas: 4 },
  },
  3: {
    4: { cartao: 490, vista: 470, funcionarios: 2, horas: 1.17 },
    10: { cartao: 900, vista: 870, funcionarios: 2, horas: 2 },
    15: { cartao: 1050, vista: 1010, funcionarios: 2, horas: 2.5 },
    20: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
  },
  4: {
    4: { cartao: 630, vista: 610, funcionarios: 2, horas: 1.5 },
    10: { cartao: 1050, vista: 1010, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
    20: { cartao: 1470, vista: 1420, funcionarios: 2, horas: 3.5 },
  },
  5: {
    4: { cartao: 700, vista: 680, funcionarios: 2, horas: 1.67 },
    10: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
    15: { cartao: 1470, vista: 1420, funcionarios: 2, horas: 3.5 },
    20: { cartao: 1800, vista: 1760, funcionarios: 2, horas: 4 },
  },
  6: {
    10: { cartao: 900, vista: 870, funcionarios: 2, horas: 2 },
    15: { cartao: 1470, vista: 1420, funcionarios: 2, horas: 3.5 },
  },
  7: {
    10: { cartao: 900, vista: 870, funcionarios: 2, horas: 2 },
    15: { cartao: 1470, vista: 1420, funcionarios: 2, horas: 3.5 },
  },
  8: {
    10: { cartao: 1050, vista: 1010, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1800, vista: 1760, funcionarios: 2, horas: 4 },
  },
  9: {
    10: { cartao: 1050, vista: 1010, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1800, vista: 1760, funcionarios: 2, horas: 4 },
  },
  10: {
    4: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
    10: { cartao: 2020, vista: 1980, funcionarios: 2, horas: 4.5 },
  },
  11: {
    4: { cartao: 1260, vista: 1210, funcionarios: 2, horas: 3 },
    10: { cartao: 2020, vista: 1980, funcionarios: 2, horas: 4.5 },
  },
} as const

const COMBO_TIERS_MAP: Record<string, ComboTierPrice[]> = {
  apartamento: [
    { max: 100, cartao: 280, vista: 260 },
    { max: 200, cartao: 330, vista: 310 },
    { max: 300, cartao: 380, vista: 360 },
    { max: 400, cartao: 430, vista: 410 },
  ],
  casa: [
    { max: 150, cartao: 340, vista: 320 },
    { max: 300, cartao: 400, vista: 380 },
    { max: 400, cartao: 460, vista: 440 },
    { max: 500, cartao: 510, vista: 490 },
  ],
  comercio: [
    { max: 150, cartao: 280, vista: 260 },
    { max: 300, cartao: 350, vista: 330 },
    { max: 400, cartao: 400, vista: 380 },
    { max: 500, cartao: 450, vista: 430 },
  ],
  barracao: [
    { max: 150, cartao: 280, vista: 260 },
    { max: 300, cartao: 350, vista: 330 },
    { max: 400, cartao: 390, vista: 370 },
    { max: 500, cartao: 430, vista: 410 },
  ],
}

export type ComboPricingError = "blocos" | "andares" | "combinacao" | null

export function findClosestComboFloorRange(andares: number, availableRanges: number[]): number | null {
  if (availableRanges.length === 0) return null

  const sortedRanges = [...availableRanges].sort((a, b) => a - b)
  for (const range of sortedRanges) {
    if (andares <= range) return range
  }

  return sortedRanges[sortedRanges.length - 1]
}

export function findComboCondominioPricing(blocos: number, andares: number) {
  const blocoPricing = COMBO_CONDOMINIO_PRECOS[blocos as keyof typeof COMBO_CONDOMINIO_PRECOS]
  if (!blocoPricing) {
    return { pricing: null as ComboCondominioPrice | null, error: "blocos" as ComboPricingError, floorKey: null }
  }

  const availableFloorRanges = Object.keys(blocoPricing).map(Number)
  const floorKey = findClosestComboFloorRange(andares, availableFloorRanges)
  if (floorKey === null) {
    return { pricing: null as ComboCondominioPrice | null, error: "andares" as ComboPricingError, floorKey: null }
  }

  const pricing = blocoPricing[floorKey as keyof typeof blocoPricing] as ComboCondominioPrice | undefined
  if (!pricing) {
    return { pricing: null as ComboCondominioPrice | null, error: "combinacao" as ComboPricingError, floorKey }
  }

  return {
    pricing: {
      ...pricing,
      cartao: applyPriceIncrease(pricing.cartao),
      vista: applyPriceIncrease(pricing.vista),
    },
    error: null as ComboPricingError,
    floorKey,
  }
}

export function getComboCondominioLabor(blocos: number, andares: number) {
  const result = findComboCondominioPricing(blocos, andares)
  if (!result.pricing) {
    return { funcionarios: 0, horas: 0 }
  }

  return { funcionarios: result.pricing.funcionarios, horas: result.pricing.horas }
}

export function calculateComboPrice(area: number, tipoImovel: string) {
  const tiers = COMBO_TIERS_MAP[tipoImovel]
  if (!tiers) return null

  const tier = tiers.find((item) => area <= item.max)
  if (tier) {
    return {
      cartao: applyPriceIncrease(tier.cartao),
      vista: applyPriceIncrease(tier.vista),
    }
  }

  const lastTier = tiers[tiers.length - 1]
  const blocksOf100 = Math.ceil((area - lastTier.max) / 100)

  return {
    cartao: applyPriceIncrease(lastTier.cartao + blocksOf100 * 50),
    vista: applyPriceIncrease(lastTier.vista + blocksOf100 * 50),
  }
}

export function formatComboHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    return `${hours}h`
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return minutes > 0 ? `${wholeHours}h ${minutes}min` : `${wholeHours}h`
}
