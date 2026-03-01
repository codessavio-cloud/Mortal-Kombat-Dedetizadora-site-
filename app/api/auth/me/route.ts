import { apiError } from "@/lib/api/response"
import { AUTH_ERROR_CODES } from "@/lib/auth/constants"
import { isJwtSecretConfigured } from "@/lib/auth/jwt"
import { getAuthenticatedUser } from "@/lib/auth/session"

export async function GET() {
  if (!isJwtSecretConfigured()) {
    return apiError(
      503,
      "JWT_SECRET nao configurado no ambiente.",
      AUTH_ERROR_CODES.jwtNotConfigured,
    )
  }

  const user = await getAuthenticatedUser()

  if (!user) {
    return apiError(401, "Nao autenticado", AUTH_ERROR_CODES.notAuthenticated)
  }

  return Response.json({
    user: {
      id: user.userId,
      username: user.username,
      role: user.role,
    },
  })
}
