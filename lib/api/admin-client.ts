import type { ApiErrorShape } from "@/lib/admin/types"

const DEFAULT_TIMEOUT_MS = 15000

interface AdminRequestOptions extends RequestInit {
  timeoutMs?: number
  query?: URLSearchParams
}

export class AdminApiError extends Error {
  status: number
  code?: string
  details?: unknown
  requestId?: string

  constructor(message: string, options: { status: number; code?: string; details?: unknown; requestId?: string }) {
    super(message)
    this.name = "AdminApiError"
    this.status = options.status
    this.code = options.code
    this.details = options.details
    this.requestId = options.requestId
  }
}

function joinSignals(...signals: Array<AbortSignal | null | undefined>): AbortSignal {
  const activeSignals = signals.filter((signal): signal is AbortSignal => Boolean(signal))

  if (activeSignals.length === 1) {
    return activeSignals[0]
  }

  const controller = new AbortController()
  for (const signal of activeSignals) {
    if (signal.aborted) {
      controller.abort(signal.reason)
      break
    }

    signal.addEventListener(
      "abort",
      () => {
        controller.abort(signal.reason)
      },
      { once: true },
    )
  }

  return controller.signal
}

async function parseErrorResponse(response: Response): Promise<ApiErrorShape> {
  try {
    const parsed = (await response.json()) as Partial<ApiErrorShape>
    if (typeof parsed.error === "string" && parsed.error.trim().length > 0) {
      return {
        error: parsed.error,
        code: typeof parsed.code === "string" ? parsed.code : undefined,
        details: parsed.details,
      }
    }
  } catch {
    // Keep fallback error below.
  }

  return { error: `Erro na requisicao (${response.status})` }
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message || fallbackMessage
  }

  return fallbackMessage
}

export function isReauthError(error: unknown) {
  if (!(error instanceof AdminApiError)) {
    return false
  }

  return (
    error.status === 401 ||
    error.code === "NOT_AUTHENTICATED" ||
    (error.status === 403 && error.code === "FORBIDDEN")
  )
}

async function request<T>(path: string, options: AdminRequestOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    query,
    headers,
    ...fetchOptions
  } = options

  const timeoutController = new AbortController()
  const timeout = setTimeout(() => timeoutController.abort(), timeoutMs)
  const url = query && Array.from(query.keys()).length > 0 ? `${path}?${query.toString()}` : path

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      signal: joinSignals(signal, timeoutController.signal),
    })

    if (!response.ok) {
      const errorBody = await parseErrorResponse(response)
      throw new AdminApiError(errorBody.error, {
        status: response.status,
        code: errorBody.code,
        details: errorBody.details,
        requestId: response.headers.get("x-request-id") || undefined,
      })
    }

    return (await response.json()) as T
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AdminApiError("Tempo limite da requisicao excedido.", {
        status: 408,
        code: "REQUEST_TIMEOUT",
      })
    }

    if (error instanceof AdminApiError) {
      throw error
    }

    throw new AdminApiError("Falha de comunicacao com a API.", {
      status: 500,
      code: "REQUEST_FAILED",
      details: error,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export const adminApi = {
  get<T>(path: string, options?: Omit<AdminRequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "GET" })
  },
  post<T>(path: string, body?: unknown, options?: Omit<AdminRequestOptions, "method" | "body">) {
    return request<T>(path, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },
  patch<T>(path: string, body?: unknown, options?: Omit<AdminRequestOptions, "method" | "body">) {
    return request<T>(path, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  },
  del<T>(path: string, options?: Omit<AdminRequestOptions, "method" | "body">) {
    return request<T>(path, { ...options, method: "DELETE" })
  },
}
