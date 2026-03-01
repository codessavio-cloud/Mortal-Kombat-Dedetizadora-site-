const PRICE_INCREASE_RATE = 1.05
const PRICE_ROUNDING_STEP = 5

function roundToNearestStep(value: number, step: number) {
  return Math.round(value / step) * step
}

export function applyPriceIncrease(value: number) {
  if (!Number.isFinite(value)) {
    return 0
  }

  const increasedPrice = value * PRICE_INCREASE_RATE
  return Math.max(0, roundToNearestStep(increasedPrice, PRICE_ROUNDING_STEP))
}

export function formatBRL(value: number) {
  const rounded = Number.isFinite(value)
    ? Math.max(0, roundToNearestStep(value, PRICE_ROUNDING_STEP))
    : 0
  return `R$ ${rounded.toLocaleString("pt-BR")}`
}
