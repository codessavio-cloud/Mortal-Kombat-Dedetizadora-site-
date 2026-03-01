import { apiError } from "@/lib/api/response"

function readContentLength(request: Request) {
  const raw = request.headers.get("content-length")
  if (!raw) {
    return null
  }

  const value = Number.parseInt(raw, 10)
  if (!Number.isFinite(value) || value < 0) {
    return null
  }

  return value
}

interface ParseJsonBodyOptions {
  allowMissingContentTypeForEmptyBody?: boolean
}

export async function parseJsonBodyWithLimit<T>(
  request: Request,
  maxBytes: number,
  route: string,
  options?: ParseJsonBodyOptions,
) {
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? ""
  if (!contentType.includes("application/json")) {
    if (options?.allowMissingContentTypeForEmptyBody) {
      const contentLength = readContentLength(request)
      if (contentLength !== null && contentLength > maxBytes) {
        return {
          data: null,
          error: apiError(413, "Payload excede o limite permitido", "PAYLOAD_TOO_LARGE", {
            route,
            maxBytes,
          }),
        } as const
      }

      const rawBody = await request.text()
      const bodySize = Buffer.byteLength(rawBody, "utf8")
      if (bodySize > maxBytes) {
        return {
          data: null,
          error: apiError(413, "Payload excede o limite permitido", "PAYLOAD_TOO_LARGE", {
            route,
            maxBytes,
          }),
        } as const
      }

      if (rawBody.trim() === "") {
        return { data: null, error: null } as const
      }
    }

    return {
      data: null,
      error: apiError(415, "Content-Type deve ser application/json", "UNSUPPORTED_MEDIA_TYPE", { route }),
    } as const
  }

  const contentLength = readContentLength(request)
  if (contentLength !== null && contentLength > maxBytes) {
    return {
      data: null,
      error: apiError(413, "Payload excede o limite permitido", "PAYLOAD_TOO_LARGE", {
        route,
        maxBytes,
      }),
    } as const
  }

  const rawBody = await request.text()
  const bodySize = Buffer.byteLength(rawBody, "utf8")
  if (bodySize > maxBytes) {
    return {
      data: null,
      error: apiError(413, "Payload excede o limite permitido", "PAYLOAD_TOO_LARGE", {
        route,
        maxBytes,
      }),
    } as const
  }

  try {
    const data = JSON.parse(rawBody) as T
    return { data, error: null } as const
  } catch {
    return {
      data: null,
      error: apiError(400, "Payload JSON invalido", "INVALID_PAYLOAD", { route }),
    } as const
  }
}
