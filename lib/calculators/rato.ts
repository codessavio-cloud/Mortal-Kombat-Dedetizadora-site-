import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

type ResidentialTier = {
  area: number
  cartao: number
  vista: number
  portaIscas: number
  tempo: string
}

type CondominioTier = {
  v4Cartao: number
  v4Vista: number
  v6Cartao: number
  v6Vista: number
  portaIscas: number
  tempo: string
}

const PRICING_TIERS: Record<number, ResidentialTier[]> = {
  4: [
    { area: 150, cartao: 400, vista: 380, portaIscas: 8, tempo: "1h" },
    { area: 300, cartao: 460, vista: 440, portaIscas: 8, tempo: "1h" },
    { area: 450, cartao: 540, vista: 520, portaIscas: 10, tempo: "1h" },
    { area: 600, cartao: 620, vista: 600, portaIscas: 12, tempo: "1h" },
    { area: 750, cartao: 670, vista: 650, portaIscas: 14, tempo: "1h" },
    { area: 900, cartao: 720, vista: 700, portaIscas: 16, tempo: "1h" },
    { area: 1000, cartao: 770, vista: 750, portaIscas: 18, tempo: "1h10" },
  ],
  6: [
    { area: 150, cartao: 600, vista: 580, portaIscas: 8, tempo: "1h" },
    { area: 300, cartao: 690, vista: 670, portaIscas: 8, tempo: "1h" },
    { area: 450, cartao: 810, vista: 790, portaIscas: 10, tempo: "1h" },
    { area: 600, cartao: 930, vista: 900, portaIscas: 12, tempo: "1h" },
    { area: 750, cartao: 1000, vista: 970, portaIscas: 14, tempo: "1h" },
    { area: 900, cartao: 1080, vista: 1050, portaIscas: 16, tempo: "1h" },
    { area: 1000, cartao: 1160, vista: 1130, portaIscas: 18, tempo: "1h10" },
    { area: 1200, cartao: 1240, vista: 1200, portaIscas: 20, tempo: "1h10" },
    { area: 1500, cartao: 1380, vista: 1340, portaIscas: 24, tempo: "1h10" },
    { area: 2000, cartao: 1530, vista: 1480, portaIscas: 28, tempo: "1h20" },
    { area: 3000, cartao: 1830, vista: 1760, portaIscas: 36, tempo: "2h" },
  ],
}

const RATO_CONDOMINIO_DADOS: Record<number, Record<string, CondominioTier>> = {
  1: {
    "4": { v4Cartao: 400, v4Vista: 380, v6Cartao: 600, v6Vista: 580, portaIscas: 8, tempo: "1h" },
    "10": { v4Cartao: 460, v4Vista: 440, v6Cartao: 690, v6Vista: 670, portaIscas: 8, tempo: "1h" },
    "15": { v4Cartao: 540, v4Vista: 520, v6Cartao: 810, v6Vista: 790, portaIscas: 10, tempo: "1h" },
    "20": { v4Cartao: 620, v4Vista: 600, v6Cartao: 930, v6Vista: 900, portaIscas: 12, tempo: "1h" },
    "25": { v4Cartao: 670, v4Vista: 650, v6Cartao: 1000, v6Vista: 970, portaIscas: 14, tempo: "1h" },
    "30": { v4Cartao: 720, v4Vista: 700, v6Cartao: 1080, v6Vista: 1050, portaIscas: 16, tempo: "1h" },
    "40": { v4Cartao: 770, v4Vista: 750, v6Cartao: 1160, v6Vista: 1130, portaIscas: 18, tempo: "1h10" },
  },
  2: {
    "4": { v4Cartao: 460, v4Vista: 440, v6Cartao: 690, v6Vista: 670, portaIscas: 8, tempo: "1h" },
    "10": { v4Cartao: 540, v4Vista: 520, v6Cartao: 810, v6Vista: 790, portaIscas: 10, tempo: "1h" },
    "15": { v4Cartao: 620, v4Vista: 600, v6Cartao: 930, v6Vista: 900, portaIscas: 12, tempo: "1h" },
    "20": { v4Cartao: 670, v4Vista: 700, v6Cartao: 1000, v6Vista: 970, portaIscas: 14, tempo: "1h" },
    "25": { v4Cartao: 720, v4Vista: 700, v6Cartao: 1080, v6Vista: 1050, portaIscas: 16, tempo: "1h" },
    "30": { v4Cartao: 820, v4Vista: 800, v6Cartao: 1230, v6Vista: 1200, portaIscas: 20, tempo: "1h10" },
    "40": { v4Cartao: 920, v4Vista: 950, v6Cartao: 1380, v6Vista: 1340, portaIscas: 24, tempo: "1h20" },
  },
  3: {
    "4": { v4Cartao: 540, v4Vista: 520, v6Cartao: 810, v6Vista: 790, portaIscas: 10, tempo: "1h" },
    "10": { v4Cartao: 720, v4Vista: 700, v6Cartao: 1080, v6Vista: 1050, portaIscas: 16, tempo: "1h" },
    "15": { v4Cartao: 820, v4Vista: 800, v6Cartao: 1230, v6Vista: 1200, portaIscas: 20, tempo: "1h10" },
    "20": { v4Cartao: 970, v4Vista: 950, v6Cartao: 1460, v6Vista: 1410, portaIscas: 26, tempo: "1h20" },
  },
  4: {
    "4": { v4Cartao: 620, v4Vista: 600, v6Cartao: 930, v6Vista: 900, portaIscas: 12, tempo: "1h" },
    "10": { v4Cartao: 920, v4Vista: 900, v6Cartao: 1380, v6Vista: 1340, portaIscas: 24, tempo: "1h20" },
    "15": { v4Cartao: 1020, v4Vista: 1000, v6Cartao: 1530, v6Vista: 1480, portaIscas: 28, tempo: "1h20" },
    "20": { v4Cartao: 1120, v4Vista: 1100, v6Cartao: 1680, v6Vista: 1620, portaIscas: 32, tempo: "1h40" },
  },
  5: {
    "4": { v4Cartao: 670, v4Vista: 650, v6Cartao: 1000, v6Vista: 970, portaIscas: 14, tempo: "1h" },
    "10": { v4Cartao: 720, v4Vista: 700, v6Cartao: 1080, v6Vista: 1050, portaIscas: 16, tempo: "1h" },
    "15": { v4Cartao: 770, v4Vista: 750, v6Cartao: 1160, v6Vista: 1130, portaIscas: 18, tempo: "1h10" },
    "20": { v4Cartao: 820, v4Vista: 800, v6Cartao: 1230, v6Vista: 1200, portaIscas: 20, tempo: "1h10" },
  },
  6: {
    "4": { v4Cartao: 720, v4Vista: 700, v6Cartao: 1080, v6Vista: 1050, portaIscas: 16, tempo: "1h" },
    "10": { v4Cartao: 920, v4Vista: 900, v6Cartao: 1380, v6Vista: 1340, portaIscas: 24, tempo: "1h20" },
  },
  7: {
    "4": { v4Cartao: 820, v4Vista: 800, v6Cartao: 1230, v6Vista: 1200, portaIscas: 20, tempo: "1h10" },
    "10": { v4Cartao: 1020, v4Vista: 1000, v6Cartao: 1530, v6Vista: 1480, portaIscas: 28, tempo: "1h20" },
  },
  8: {
    "4": { v4Cartao: 920, v4Vista: 900, v6Cartao: 1380, v6Vista: 1340, portaIscas: 24, tempo: "1h20" },
    "10": { v4Cartao: 1020, v4Vista: 1000, v6Cartao: 1530, v6Vista: 1480, portaIscas: 28, tempo: "1h20" },
  },
  9: {
    "4": { v4Cartao: 970, v4Vista: 950, v6Cartao: 1460, v6Vista: 1410, portaIscas: 26, tempo: "1h20" },
    "10": { v4Cartao: 1220, v4Vista: 1200, v6Cartao: 1830, v6Vista: 1760, portaIscas: 36, tempo: "2h" },
  },
  10: {
    "4": { v4Cartao: 1170, v4Vista: 1150, v6Cartao: 1760, v6Vista: 1690, portaIscas: 34, tempo: "1h40" },
    "10": { v4Cartao: 1320, v4Vista: 1300, v6Cartao: 1980, v6Vista: 1900, portaIscas: 40, tempo: "2h" },
  },
  11: {
    "4": { v4Cartao: 1270, v4Vista: 1250, v6Cartao: 1900, v6Vista: 1830, portaIscas: 38, tempo: "2h" },
    "10": { v4Cartao: 1420, v4Vista: 1400, v6Cartao: 2130, v6Vista: 2040, portaIscas: 44, tempo: "2h" },
  },
}

export function calculateRatoResidentialPrice(area: number, tipoVisita: 4 | 6) {
  const tiers = PRICING_TIERS[tipoVisita]
  if (!tiers) return null

  for (const tier of tiers) {
    if (area <= tier.area) {
      return {
        ...tier,
        cartao: applyPriceIncrease(tier.cartao),
        vista: applyPriceIncrease(tier.vista),
      }
    }
  }

  const lastTier = tiers[tiers.length - 1]
  const excessArea = area - lastTier.area
  const blocksOf100 = Math.ceil(excessArea / 100)
  const additionalCost = blocksOf100 * 50

  return {
    cartao: applyPriceIncrease(lastTier.cartao + additionalCost),
    vista: applyPriceIncrease(lastTier.vista + additionalCost),
    portaIscas: lastTier.portaIscas + Math.ceil(blocksOf100 / 2) * 2,
    tempo: "2h+",
  }
}

function resolveAndaresFaixa(andares: number) {
  if (andares <= 4) return "4"
  if (andares <= 10) return "10"
  if (andares <= 15) return "15"
  if (andares <= 20) return "20"
  if (andares <= 25) return "25"
  if (andares <= 30) return "30"
  return "40"
}

export function calculateRatoCondominioPrice(blocos: number, andares: number, tipoVisita: 4 | 6) {
  const blocoData = RATO_CONDOMINIO_DADOS[blocos]
  if (!blocoData) {
    return { error: "blocos" as const, pricing: null }
  }

  const faixaAndares = resolveAndaresFaixa(andares)
  const precos = blocoData[faixaAndares]

  if (!precos) {
    const faixasDisponiveis = Object.keys(blocoData)
    const maiorFaixa = faixasDisponiveis[faixasDisponiveis.length - 1]
    const precosMax = blocoData[maiorFaixa]
    if (!precosMax) {
      return { error: "combinacao" as const, pricing: null }
    }

    return {
      error: null,
      pricing: {
        cartao: applyPriceIncrease(tipoVisita === 4 ? precosMax.v4Cartao : precosMax.v6Cartao),
        vista: applyPriceIncrease(tipoVisita === 4 ? precosMax.v4Vista : precosMax.v6Vista),
        portaIscas: precosMax.portaIscas,
        tempo: precosMax.tempo,
      },
    }
  }

  return {
    error: null,
    pricing: {
      cartao: applyPriceIncrease(tipoVisita === 4 ? precos.v4Cartao : precos.v6Cartao),
      vista: applyPriceIncrease(tipoVisita === 4 ? precos.v4Vista : precos.v6Vista),
      portaIscas: precos.portaIscas,
      tempo: precos.tempo,
    },
  }
}
