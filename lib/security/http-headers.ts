interface ApplySecurityHeadersOptions {
  rateLimitRemaining?: number | null
  requestId?: string | null
}

export function getOrCreateRequestId(request: Request) {
  const headerValue = request.headers.get("x-request-id")?.trim()
  if (headerValue && headerValue.length > 0 && headerValue.length <= 120) {
    return headerValue
  }
  return crypto.randomUUID()
}

export function applySecurityHeaders<T extends Response>(
  response: T,
  options?: ApplySecurityHeadersOptions,
) {
  const isDevelopment = process.env.NODE_ENV !== "production"
  const scriptSrc = isDevelopment
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
    : "script-src 'self' 'unsafe-inline'"

  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; ${scriptSrc}; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://maps.google.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self';`,
  )
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin")
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin")
  response.headers.set("Origin-Agent-Cluster", "?1")
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none")
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate")
  response.headers.set("Pragma", "no-cache")
  response.headers.set("Permissions-Policy", "geolocation=(self), microphone=(), camera=()")

  if (typeof options?.rateLimitRemaining === "number") {
    response.headers.set("X-RateLimit-Remaining", String(options.rateLimitRemaining))
  }

  if (options?.requestId) {
    response.headers.set("X-Request-Id", options.requestId)
  }

  return response
}
