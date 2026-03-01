import { applyPriceIncrease } from "@/lib/calculators/price-adjustment"

export function calculatePulgaCarrapatoPercevejoPrice(area: number, tipoImovel: string) {
  let cartao = 0
  let vista = 0

  if (tipoImovel === "apartamento") {
    if (area <= 100) {
      cartao = 550
      vista = 530
    } else if (area <= 200) {
      cartao = 600
      vista = 580
    } else {
      cartao = 600 + Math.ceil((area - 200) / 100) * 45
      vista = 580 + Math.ceil((area - 200) / 100) * 40
    }
  } else if (tipoImovel === "casa") {
    if (area <= 150) {
      cartao = 590
      vista = 570
    } else if (area <= 500) {
      cartao = 680
      vista = 660
    } else {
      cartao = 680 + Math.ceil((area - 500) / 100) * 50
      vista = 660 + Math.ceil((area - 500) / 100) * 45
    }
  } else if (tipoImovel === "comercio") {
    if (area <= 150) {
      cartao = 650
      vista = 620
    } else if (area <= 500) {
      cartao = 700
      vista = 680
    } else {
      cartao = 700 + Math.ceil((area - 500) / 100) * 55
      vista = 680 + Math.ceil((area - 500) / 100) * 50
    }
  } else if (tipoImovel === "barracao") {
    if (area <= 150) {
      cartao = 650
      vista = 620
    } else if (area <= 500) {
      cartao = 700
      vista = 680
    } else {
      cartao = 700 + Math.ceil((area - 500) / 100) * 60
      vista = 680 + Math.ceil((area - 500) / 100) * 55
    }
  } else {
    return null
  }

  return {
    cartao: applyPriceIncrease(cartao),
    vista: applyPriceIncrease(vista),
  }
}
