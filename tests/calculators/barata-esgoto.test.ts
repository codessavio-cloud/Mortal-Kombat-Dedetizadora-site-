import { describe, expect, it } from "vitest"

import {
  calculateBarataEsgotoPrice,
  findClosestFloorRange,
  formatHours,
} from "@/lib/calculators/barata-esgoto"

describe("barata-esgoto calculators", () => {
  it("aplica tabela de comercio com aumento", () => {
    const result = calculateBarataEsgotoPrice(150, "comercio")

    expect(result).toEqual({
      cartao: 180,
      vista: 160,
    })
  })

  it("encontra faixa de andares mais proxima", () => {
    expect(findClosestFloorRange(11, [4, 10, 15, 20])).toBe(15)
    expect(findClosestFloorRange(50, [4, 10, 15, 20])).toBe(20)
  })

  it("formata horas fracionadas", () => {
    expect(formatHours(2)).toBe("2h")
    expect(formatHours(1.67)).toBe("1h 40min")
  })
})
