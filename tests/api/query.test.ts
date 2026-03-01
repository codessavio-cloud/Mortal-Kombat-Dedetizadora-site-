import { describe, expect, it } from "vitest"

import { parseStringQueryParam } from "@/lib/api/query"

describe("parseStringQueryParam", () => {
  it("retorna erro quando excede maxLength", () => {
    const result = parseStringQueryParam("x".repeat(65), {
      name: "search",
      maxLength: 64,
    })

    expect(result.value).toBeNull()
    expect(result.error?.code).toBe("INVALID_QUERY_PARAM_RANGE")
  })

  it("aceita valor valido dentro de maxLength", () => {
    const result = parseStringQueryParam("texto-valido", {
      name: "search",
      maxLength: 64,
    })

    expect(result.error).toBeNull()
    expect(result.value).toBe("texto-valido")
  })
})
