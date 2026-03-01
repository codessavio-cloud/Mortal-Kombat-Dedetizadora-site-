import { FALLBACK_ADMIN_DEFAULT_ID } from "@/lib/auth/constants"

const USERNAME_PATTERN = /^[a-zA-Z0-9._-]{3,32}$/
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export const PASSWORD_MIN_LENGTH = 6
export const PASSWORD_MAX_LENGTH = 128

export function isValidUsername(username: string) {
  return USERNAME_PATTERN.test(username)
}

export function isValidUserId(value: string) {
  if (value === FALLBACK_ADMIN_DEFAULT_ID) {
    return true
  }
  return UUID_PATTERN.test(value)
}

export function sanitizePlainText(value: string, maxLength: number) {
  const normalized = Array.from(value, (char) => {
    const code = char.charCodeAt(0)
    if ((code >= 0 && code <= 31) || code === 127) {
      return " "
    }
    return char
  })
    .join("")
    .trim()

  if (normalized.length <= maxLength) {
    return normalized
  }
  return normalized.slice(0, maxLength)
}

export function validatePasswordLength(password: string) {
  return password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH
}

export function normalizeOptionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = sanitizePlainText(value, maxLength)
  return normalized.length > 0 ? normalized : null
}

export function normalizeCoordinate(value: unknown, min: number, max: number) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null
  }
  if (value < min || value > max) {
    return null
  }
  return value
}
