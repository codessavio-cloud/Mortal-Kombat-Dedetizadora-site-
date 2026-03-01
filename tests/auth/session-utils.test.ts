import { describe, expect, it } from "vitest"

import {
  resolvePostLoginRedirect,
  sanitizeNextPath,
  toIsoFromUnixTimestamp,
} from "@/lib/auth/session-utils"

describe("sanitizeNextPath", () => {
  it("aceita rotas internas seguras", () => {
    expect(sanitizeNextPath("/admin")).toBe("/admin")
    expect(sanitizeNextPath("/baratinha?x=1")).toBe("/baratinha?x=1")
  })

  it("bloqueia rotas perigosas ou invalidas", () => {
    expect(sanitizeNextPath("https://evil.com")).toBeNull()
    expect(sanitizeNextPath("//evil.com")).toBeNull()
    expect(sanitizeNextPath("/api/users")).toBeNull()
    expect(sanitizeNextPath("/login")).toBeNull()
  })
})

describe("resolvePostLoginRedirect", () => {
  it("prioriza a rota solicitada originalmente", () => {
    expect(
      resolvePostLoginRedirect({
        role: "funcionario",
        requestedPath: "/escorpiao",
        apiRedirectTo: "/admin",
      }),
    ).toBe("/escorpiao")
  })

  it("usa redirect da API quando nao ha requestedPath", () => {
    expect(
      resolvePostLoginRedirect({
        role: "funcionario",
        apiRedirectTo: "/formiga",
      }),
    ).toBe("/formiga")
  })

  it("usa fallback por perfil quando nao ha redirect explicito", () => {
    expect(resolvePostLoginRedirect({ role: "admin" })).toBe("/admin")
    expect(resolvePostLoginRedirect({ role: "funcionario" })).toBe("/")
  })
})

describe("toIsoFromUnixTimestamp", () => {
  it("converte epoch em ISO", () => {
    expect(toIsoFromUnixTimestamp(1704067200)).toBe("2024-01-01T00:00:00.000Z")
  })

  it("retorna null para valores invalidos", () => {
    expect(toIsoFromUnixTimestamp(0)).toBeNull()
    expect(toIsoFromUnixTimestamp(-1)).toBeNull()
    expect(toIsoFromUnixTimestamp(Number.NaN)).toBeNull()
  })
})
