import { sanitizePlainText } from "@/lib/security/validation"

type QueryValidationError = {
  error: string
  code: string
  details?: unknown
}

export function parseIntegerQueryParam(
  value: string | null,
  config: {
    name: string
    defaultValue: number
    min: number
    max: number
  },
): { value: number; error: QueryValidationError | null } {
  if (value === null || value.trim() === "") {
    return { value: config.defaultValue, error: null }
  }

  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed)) {
    return {
      value: config.defaultValue,
      error: {
        error: `${config.name} invalido`,
        code: "INVALID_QUERY_PARAM",
        details: { param: config.name, expected: "integer" },
      },
    }
  }

  if (parsed < config.min || parsed > config.max) {
    return {
      value: config.defaultValue,
      error: {
        error: `${config.name} fora do intervalo permitido`,
        code: "INVALID_QUERY_PARAM_RANGE",
        details: { param: config.name, min: config.min, max: config.max },
      },
    }
  }

  return { value: parsed, error: null }
}

export function parseBooleanQueryParam(
  value: string | null,
  config: {
    name: string
    defaultValue: boolean
  },
): { value: boolean; error: QueryValidationError | null } {
  if (value === null || value.trim() === "") {
    return { value: config.defaultValue, error: null }
  }

  const normalized = value.trim().toLowerCase()
  if (normalized === "1" || normalized === "true") {
    return { value: true, error: null }
  }
  if (normalized === "0" || normalized === "false") {
    return { value: false, error: null }
  }

  return {
    value: config.defaultValue,
    error: {
      error: `${config.name} invalido`,
      code: "INVALID_QUERY_PARAM",
      details: { param: config.name, expected: "boolean" },
    },
  }
}

export function parseStringQueryParam(
  value: string | null,
  config: {
    name: string
    maxLength: number
    allowEmpty?: boolean
  },
): { value: string | null; error: QueryValidationError | null } {
  if (value === null) {
    return { value: null, error: null }
  }

  const sanitized = sanitizePlainText(value, config.maxLength)
  if (sanitized.length === 0 && !config.allowEmpty) {
    return { value: null, error: null }
  }

  if (sanitized.length > config.maxLength) {
    return {
      value: null,
      error: {
        error: `${config.name} excede o tamanho permitido`,
        code: "INVALID_QUERY_PARAM_RANGE",
        details: { param: config.name, maxLength: config.maxLength },
      },
    }
  }

  return { value: sanitized, error: null }
}
