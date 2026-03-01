import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

type EscorpiaoCondominioPrice = {
  cartao: number
  vista: number
  funcionarios: number
  horas: number
}

type EscorpiaoTierPrice = {
  max: number
  cartao: number
  vista: number
}

export const ESCORPIAO_CONDOMINIO_PRECOS = {
  1: {
    4: { cartao: 280, vista: 260, funcionarios: 1, horas: 1 },
    10: { cartao: 380, vista: 360, funcionarios: 2, horas: 1 },
    15: { cartao: 440, vista: 420, funcionarios: 2, horas: 1.5 },
    20: { cartao: 520, vista: 500, funcionarios: 2, horas: 1.5 },
    25: { cartao: 760, vista: 730, funcionarios: 2, horas: 2 },
    30: { cartao: 950, vista: 910, funcionarios: 2, horas: 2.5 },
    40: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
  },
  2: {
    4: { cartao: 380, vista: 360, funcionarios: 1, horas: 1 },
    10: { cartao: 520, vista: 500, funcionarios: 2, horas: 1.5 },
    15: { cartao: 630, vista: 610, funcionarios: 2, horas: 1.67 },
    20: { cartao: 760, vista: 730, funcionarios: 2, horas: 2 },
    25: { cartao: 950, vista: 910, funcionarios: 2, horas: 2.5 },
    30: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
    40: { cartao: 1520, vista: 1480, funcionarios: 2, horas: 4 },
  },
  3: {
    4: { cartao: 440, vista: 420, funcionarios: 2, horas: 1.17 },
    10: { cartao: 760, vista: 730, funcionarios: 2, horas: 2 },
    15: { cartao: 950, vista: 920, funcionarios: 2, horas: 2.5 },
    20: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
  },
  4: {
    4: { cartao: 520, vista: 500, funcionarios: 2, horas: 1.5 },
    10: { cartao: 950, vista: 920, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1330, vista: 1280, funcionarios: 2, horas: 3.5 },
  },
  5: {
    4: { cartao: 580, vista: 560, funcionarios: 2, horas: 1.67 },
    10: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
    15: { cartao: 1330, vista: 1280, funcionarios: 2, horas: 3.5 },
    20: { cartao: 1520, vista: 1480, funcionarios: 2, horas: 4 },
  },
  6: {
    10: { cartao: 760, vista: 730, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1330, vista: 1280, funcionarios: 2, horas: 3.5 },
  },
  7: {
    10: { cartao: 760, vista: 730, funcionarios: 2, horas: 2 },
    15: { cartao: 1330, vista: 1280, funcionarios: 2, horas: 3.5 },
  },
  8: {
    10: { cartao: 950, vista: 920, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1520, vista: 1480, funcionarios: 2, horas: 4 },
  },
  9: {
    10: { cartao: 950, vista: 920, funcionarios: 2, horas: 2.5 },
    15: { cartao: 1520, vista: 1480, funcionarios: 2, horas: 4 },
  },
  10: {
    4: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
    10: { cartao: 1710, vista: 1670, funcionarios: 2, horas: 4.5 },
  },
  11: {
    4: { cartao: 1040, vista: 990, funcionarios: 2, horas: 3 },
    10: { cartao: 1710, vista: 1670, funcionarios: 2, horas: 4.5 },
  },
} as const

const ESCORPIAO_TIERS_MAP: Record<string, EscorpiaoTierPrice[]> = {
  apartamento: [
    { max: 100, cartao: 220, vista: 200 },
    { max: 200, cartao: 270, vista: 250 },
    { max: 300, cartao: 320, vista: 300 },
    { max: 400, cartao: 370, vista: 350 },
  ],
  casa: [
    { max: 150, cartao: 270, vista: 250 },
    { max: 300, cartao: 340, vista: 320 },
    { max: 400, cartao: 400, vista: 380 },
    { max: 500, cartao: 480, vista: 460 },
  ],
  comercio: [
    { max: 150, cartao: 220, vista: 200 },
    { max: 300, cartao: 270, vista: 250 },
    { max: 400, cartao: 340, vista: 320 },
    { max: 500, cartao: 420, vista: 400 },
  ],
  barracao: [
    { max: 150, cartao: 220, vista: 200 },
    { max: 300, cartao: 270, vista: 250 },
    { max: 400, cartao: 320, vista: 300 },
    { max: 500, cartao: 380, vista: 360 },
  ],
}

export type EscorpiaoPricingError = "blocos" | "andares" | "combinacao" | null

export function findClosestEscorpiaoFloorRange(andares: number, availableRanges: number[]): number | null {
  if (availableRanges.length === 0) return null

  const sortedRanges = [...availableRanges].sort((a, b) => a - b)
  for (const range of sortedRanges) {
    if (andares <= range) return range
  }

  return sortedRanges[sortedRanges.length - 1]
}

export function findEscorpiaoCondominioPricing(blocos: number, andares: number) {
  const blocoPricing = ESCORPIAO_CONDOMINIO_PRECOS[blocos as keyof typeof ESCORPIAO_CONDOMINIO_PRECOS]
  if (!blocoPricing) {
    return { pricing: null as EscorpiaoCondominioPrice | null, error: "blocos" as EscorpiaoPricingError, floorKey: null }
  }

  const availableFloorRanges = Object.keys(blocoPricing).map(Number)
  const floorKey = findClosestEscorpiaoFloorRange(andares, availableFloorRanges)
  if (floorKey === null) {
    return { pricing: null as EscorpiaoCondominioPrice | null, error: "andares" as EscorpiaoPricingError, floorKey: null }
  }

  const pricing = blocoPricing[floorKey as keyof typeof blocoPricing] as EscorpiaoCondominioPrice | undefined
  if (!pricing) {
    return {
      pricing: null as EscorpiaoCondominioPrice | null,
      error: "combinacao" as EscorpiaoPricingError,
      floorKey,
    }
  }

  return {
    pricing: {
      ...pricing,
      cartao: applyPriceIncrease(pricing.cartao),
      vista: applyPriceIncrease(pricing.vista),
    },
    error: null as EscorpiaoPricingError,
    floorKey,
  }
}

export function getEscorpiaoCondominioLabor(blocos: number, andares: number) {
  const result = findEscorpiaoCondominioPricing(blocos, andares)
  if (!result.pricing) {
    return { funcionarios: 0, horas: 0 }
  }

  return { funcionarios: result.pricing.funcionarios, horas: result.pricing.horas }
}

export function calculateEscorpiaoPrice(area: number, tipoImovel: string) {
  const tiers = ESCORPIAO_TIERS_MAP[tipoImovel]
  if (!tiers) return null

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

  return {
    cartao: applyPriceIncrease(lastTier.cartao + blocksOf100 * 60),
    vista: applyPriceIncrease(lastTier.vista + blocksOf100 * 60),
  }
}

export function formatEscorpiaoHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    return `${hours}h`
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return minutes > 0 ? `${wholeHours}h ${minutes}min` : `${wholeHours}h`
}
