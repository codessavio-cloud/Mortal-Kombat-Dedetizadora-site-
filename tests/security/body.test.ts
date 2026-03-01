import { describe, expect, it } from "vitest"

import { parseJsonBodyWithLimit } from "@/lib/security/body"

async function readErrorCode(response: Response | null) {
  if (!response) {
    return null
  }

  const payload = await response.json().catch(() => null)
  return payload?.code ?? null
}

describe("parseJsonBodyWithLimit", () => {
  it("retorna 415 por padrao quando content-type nao e json", async () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
    })

    const { error } = await parseJsonBodyWithLimit<Record<string, unknown>>(request, 1024, "/api/test")

    expect(error).not.toBeNull()
    expect(error?.status).toBe(415)
    await expect(readErrorCode(error)).resolves.toBe("UNSUPPORTED_MEDIA_TYPE")
  })

  it("permite body vazio sem content-type quando configurado", async () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
    })

    const result = await parseJsonBodyWithLimit<Record<string, unknown>>(request, 1024, "/api/test", {
      allowMissingContentTypeForEmptyBody: true,
    })

    expect(result.error).toBeNull()
    expect(result.data).toBeNull()
  })

  it("mantem 415 para body nao vazio sem content-type", async () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      body: "raw-body",
    })

    const { error } = await parseJsonBodyWithLimit<Record<string, unknown>>(request, 1024, "/api/test", {
      allowMissingContentTypeForEmptyBody: true,
    })

    expect(error).not.toBeNull()
    expect(error?.status).toBe(415)
    await expect(readErrorCode(error)).resolves.toBe("UNSUPPORTED_MEDIA_TYPE")
  })

  it("retorna 413 para payload acima do limite", async () => {
    const request = new Request("https://example.com/api/test", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value: "1234567890",
      }),
    })

    const { error } = await parseJsonBodyWithLimit<Record<string, unknown>>(request, 4, "/api/test")

    expect(error).not.toBeNull()
    expect(error?.status).toBe(413)
    await expect(readErrorCode(error)).resolves.toBe("PAYLOAD_TOO_LARGE")
  })
})
