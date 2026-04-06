const PRICE_INCREASE_RATE = 1.05
const PRICE_ROUNDING_STEP = 5
const brlFormatter = new Intl.NumberFormat("pt-BR")

function roundToNearestStep(value: number, step: number) {
  return Math.round(value / step) * step
}

export function normalizePrice(value: number, step = PRICE_ROUNDING_STEP) {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  const safeStep = Number.isFinite(step) && step > 0 ? step : PRICE_ROUNDING_STEP
  return roundToNearestStep(value, safeStep)
}

export function applyPriceIncrease(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return 0
  }

  return normalizePrice(value * PRICE_INCREASE_RATE)
}

export function formatBRL(value: number) {
  return `R$ ${brlFormatter.format(normalizePrice(value))}`
}
