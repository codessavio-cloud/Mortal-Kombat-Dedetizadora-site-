import { NextResponse } from "next/server"

export function apiError(
  status: number,
  error: string,
  code?: string,
  details?: unknown,
  requestId?: string,
) {
  const response = NextResponse.json(
    {
      error,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  )

  if (requestId) {
    response.headers.set("X-Request-Id", requestId)
  }

  return response
}
