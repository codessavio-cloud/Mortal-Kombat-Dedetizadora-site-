import { SignJWT, jwtVerify, type JWTPayload } from "jose"

import { AUTH_SESSION_TTL_SECONDS, JWT_ALGORITHM } from "@/lib/auth/constants"

export type UserRole = "admin" | "funcionario"

export interface AuthTokenPayload extends JWTPayload {
  id: string
  userId: string
  username: string
  role: UserRole
}

function readJwtSecret() {
  const value = process.env.JWT_SECRET?.trim()
  return value && value.length > 0 ? value : null
}

function readEncodedJwtSecret() {
  const secret = readJwtSecret()
  if (!secret) {
    throw new Error("JWT_SECRET_NOT_CONFIGURED")
  }

  return new TextEncoder().encode(secret)
}

export function isJwtSecretConfigured() {
  return readJwtSecret() !== null
}

export async function signAuthToken(
  payload: Omit<AuthTokenPayload, "iat" | "exp">,
) {
  const secret = readEncodedJwtSecret()

  return new SignJWT(payload)
    .setProtectedHeader({ alg: JWT_ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(`${AUTH_SESSION_TTL_SECONDS}s`)
    .sign(secret)
}

function isAuthTokenPayload(payload: JWTPayload): payload is AuthTokenPayload {
  return (
    typeof payload.id === "string" &&
    typeof payload.userId === "string" &&
    typeof payload.username === "string" &&
    (payload.role === "admin" || payload.role === "funcionario")
  )
}

export async function verifyAuthToken(token: string) {
  try {
    const secret = readEncodedJwtSecret()
    const { payload } = await jwtVerify(token, secret, { algorithms: [JWT_ALGORITHM] })

    if (!isAuthTokenPayload(payload)) {
      return null
    }

    return payload
  } catch {
    return null
  }
}
