const PRICE_INCREASE_RATE = 1.05

export function applyPriceIncrease(value: number) {
  return Math.round(value * PRICE_INCREASE_RATE * 100) / 100
}

export function formatBRL(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`
}
