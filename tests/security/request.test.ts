import { describe, expect, it } from "vitest"

import { enforceSameOrigin } from "@/lib/security/request"

describe("enforceSameOrigin", () => {
  it("permite origem valida", async () => {
    const request = new Request("https://example.com/api/users", {
      headers: {
        origin: "https://example.com",
      },
    })

    const result = enforceSameOrigin(request, "/api/users")
    expect(result).toBeNull()
  })

  it("bloqueia origem diferente", async () => {
    const request = new Request("https://example.com/api/users", {
      headers: {
        origin: "https://evil.com",
      },
    })

    const response = enforceSameOrigin(request, "/api/users")
    expect(response).not.toBeNull()
    expect(response?.status).toBe(403)

    const body = await response?.json()
    expect(body).toMatchObject({
      error: "Origem da requisicao invalida",
      code: "INVALID_ORIGIN",
    })
  })

  it("bloqueia sec-fetch-site cross-site sem origin", async () => {
    const request = new Request("https://example.com/api/users", {
      headers: {
        "sec-fetch-site": "cross-site",
      },
    })

    const response = enforceSameOrigin(request, "/api/users")
    expect(response).not.toBeNull()
    expect(response?.status).toBe(403)
  })
})
