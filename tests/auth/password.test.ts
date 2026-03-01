import { describe, expect, it } from "vitest"

import { hashPassword, isHashedPassword, verifyPassword } from "@/lib/auth/password"

describe("password security", () => {
  it("gera hash scrypt e valida credencial", async () => {
    const hash = await hashPassword("SenhaForte123!")
    expect(isHashedPassword(hash)).toBe(true)

    const result = await verifyPassword("SenhaForte123!", hash)
    expect(result).toEqual({ valid: true, needsRehash: false })
  })

  it("mantem compatibilidade com senha legada", async () => {
    const valid = await verifyPassword("abc123", "abc123")
    const invalid = await verifyPassword("outra", "abc123")

    expect(valid).toEqual({ valid: true, needsRehash: true })
    expect(invalid).toEqual({ valid: false, needsRehash: false })
  })
})
