import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

type FormigaCondominioPrice = {
  card: number
  cash: number
  employees: number
  hours: number
}

type FormigaTierPrice = {
  max: number
  cartao: number
  vista: number
}

export const FORMIGA_CONDOMINIO_PRICING = {
  1: {
    4: { card: 280, cash: 260, employees: 1, hours: 1 },
    10: { card: 380, cash: 360, employees: 2, hours: 1 },
    15: { card: 440, cash: 420, employees: 2, hours: 1.5 },
    20: { card: 520, cash: 500, employees: 2, hours: 1.5 },
    25: { card: 760, cash: 730, employees: 2, hours: 2 },
    30: { card: 950, cash: 910, employees: 2, hours: 2.5 },
    40: { card: 1040, cash: 990, employees: 2, hours: 3 },
  },
  2: {
    4: { card: 380, cash: 360, employees: 2, hours: 1 },
    10: { card: 520, cash: 500, employees: 2, hours: 1.5 },
    15: { card: 630, cash: 610, employees: 2, hours: 1.67 },
    20: { card: 760, cash: 730, employees: 2, hours: 2 },
    25: { card: 950, cash: 910, employees: 2, hours: 2.5 },
    30: { card: 1040, cash: 990, employees: 2, hours: 3 },
    40: { card: 1520, cash: 1480, employees: 2, hours: 4 },
  },
  3: {
    4: { card: 440, cash: 420, employees: 2, hours: 1.17 },
    10: { card: 760, cash: 730, employees: 2, hours: 2 },
    15: { card: 950, cash: 920, employees: 2, hours: 2.5 },
    20: { card: 1040, cash: 990, employees: 2, hours: 3 },
  },
  4: {
    4: { card: 520, cash: 500, employees: 2, hours: 1.5 },
    10: { card: 950, cash: 920, employees: 2, hours: 2.5 },
    15: { card: 1330, cash: 1280, employees: 2, hours: 3.5 },
  },
  5: {
    4: { card: 580, cash: 560, employees: 2, hours: 1.67 },
    10: { card: 1040, cash: 990, employees: 2, hours: 3 },
    15: { card: 1330, cash: 1280, employees: 2, hours: 3.5 },
    20: { card: 1520, cash: 1480, employees: 2, hours: 4 },
  },
  6: {
    10: { card: 760, cash: 730, employees: 2, hours: 2 },
    15: { card: 1330, cash: 1280, employees: 2, hours: 3.5 },
  },
  7: {
    10: { card: 760, cash: 730, employees: 2, hours: 2 },
    15: { card: 1330, cash: 1280, employees: 2, hours: 3.5 },
  },
  8: {
    10: { card: 950, cash: 920, employees: 2, hours: 2.5 },
  },
  9: {
    10: { card: 950, cash: 920, employees: 2, hours: 2.5 },
  },
  10: {
    4: { card: 1040, cash: 990, employees: 2, hours: 3 },
    10: { card: 1710, cash: 1670, employees: 2, hours: 4.5 },
  },
  11: {
    4: { card: 1040, cash: 990, employees: 2, hours: 3 },
    10: { card: 1710, cash: 1670, employees: 2, hours: 4.5 },
  },
} as const

const FORMIGA_RESIDENTIAL_TIERS: Record<string, FormigaTierPrice[]> = {
  apartamento: [
    { max: 100, cartao: 230, vista: 210 },
    { max: 200, cartao: 280, vista: 260 },
    { max: 300, cartao: 330, vista: 310 },
    { max: 400, cartao: 380, vista: 360 },
  ],
  casa: [
    { max: 150, cartao: 280, vista: 260 },
    { max: 300, cartao: 360, vista: 340 },
    { max: 400, cartao: 440, vista: 420 },
    { max: 500, cartao: 540, vista: 520 },
  ],
  comercio: [
    { max: 150, cartao: 230, vista: 210 },
    { max: 300, cartao: 290, vista: 270 },
    { max: 400, cartao: 360, vista: 340 },
    { max: 500, cartao: 460, vista: 440 },
  ],
  barracao: [
    { max: 150, cartao: 230, vista: 210 },
    { max: 300, cartao: 290, vista: 270 },
    { max: 400, cartao: 360, vista: 340 },
    { max: 500, cartao: 460, vista: 440 },
  ],
}

function findClosestFloorRange(blocks: number, floors: number): number | null {
  const blockData = FORMIGA_CONDOMINIO_PRICING[blocks as keyof typeof FORMIGA_CONDOMINIO_PRICING]
  if (!blockData) return null

  const availableFloors = Object.keys(blockData)
    .map(Number)
    .sort((a, b) => a - b)

  for (const floorRange of availableFloors) {
    if (floors <= floorRange) {
      return floorRange
    }
  }

  return availableFloors[availableFloors.length - 1]
}

export function getFormigaCondominioPricing(blocks: number, floors: number): FormigaCondominioPrice | null {
  const floorRange = findClosestFloorRange(blocks, floors)
  if (!floorRange) return null

  const blockData = FORMIGA_CONDOMINIO_PRICING[blocks as keyof typeof FORMIGA_CONDOMINIO_PRICING]
  if (!blockData) return null

  const pricing = (blockData[floorRange as keyof typeof blockData] as FormigaCondominioPrice) || null
  if (!pricing) return null

  return {
    ...pricing,
    card: applyPriceIncrease(pricing.card),
    cash: applyPriceIncrease(pricing.cash),
  }
}

export function getFormigaCondominioLabor(blocks: number, floors: number) {
  const pricing = getFormigaCondominioPricing(blocks, floors)
  if (!pricing) {
    return { funcionarios: 0, horas: 0 }
  }

  return { funcionarios: pricing.employees, horas: pricing.hours }
}

export function getFormigaCondominioMaxFloors(blocks: number) {
  const blockData = FORMIGA_CONDOMINIO_PRICING[blocks as keyof typeof FORMIGA_CONDOMINIO_PRICING]
  if (!blockData) return null

  const floors = Object.keys(blockData).map(Number)
  if (floors.length === 0) return null
  return Math.max(...floors)
}

export function calculateFormigaResidentialPrice(area: number, tipoImovel: string) {
  const tiers = FORMIGA_RESIDENTIAL_TIERS[tipoImovel]
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
  const additionalCost = blocksOf100 * 80

  return {
    cartao: applyPriceIncrease(lastTier.cartao + additionalCost),
    vista: applyPriceIncrease(lastTier.vista + additionalCost),
  }
}

export function formatFormigaHours(hours: number): string {
  if (hours === Math.floor(hours)) {
    return `${hours}h`
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round((hours - wholeHours) * 60)
  return minutes > 0 ? `${wholeHours}h${minutes}min` : `${wholeHours}h`
}
