import { NextResponse } from "next/server"

export function apiError(
  status: number,
  error: string,
  code?: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error,
      ...(code ? { code } : {}),
      ...(details !== undefined ? { details } : {}),
    },
    { status },
  )
}
