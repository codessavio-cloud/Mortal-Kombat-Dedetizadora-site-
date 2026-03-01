import { apiError } from "@/lib/api/response"
import { appLogger } from "@/lib/observability/logger"

function getOriginFromHeader(value: string | null) {
  if (!value) {
    return null
  }

  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

export function enforceSameOrigin(request: Request, route: string) {
  let requestOrigin: string
  try {
    requestOrigin = new URL(request.url).origin
  } catch {
    return apiError(400, "URL da requisicao invalida", "INVALID_REQUEST_URL")
  }

  const origin = getOriginFromHeader(request.headers.get("origin"))
  const refererOrigin = getOriginFromHeader(request.headers.get("referer"))
  const fetchSite = (request.headers.get("sec-fetch-site") || "").toLowerCase()

  const headerOrigin = origin ?? refererOrigin
  if (!headerOrigin) {
    if (fetchSite === "cross-site") {
      appLogger.warn("Requisicao bloqueada por sec-fetch-site cross-site sem origem", {
        route,
        requestOrigin,
        fetchSite,
      })
      return apiError(403, "Origem da requisicao invalida", "INVALID_ORIGIN")
    }
    return null
  }

  if (headerOrigin !== requestOrigin) {
    appLogger.warn("Requisicao bloqueada por origem invalida", {
      route,
      requestOrigin,
      headerOrigin,
    })
    return apiError(403, "Origem da requisicao invalida", "INVALID_ORIGIN")
  }

  return null
}
