import { createClient } from "@supabase/supabase-js"

import { getSupabaseServiceConfig } from "@/lib/supabase/config"

const DEFAULT_SUPABASE_TIMEOUT_MS = 12_000

async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  timeoutMs: number,
) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    })
  } finally {
    clearTimeout(timeout)
  }
}

export function createServiceSupabaseClient(timeoutMs = DEFAULT_SUPABASE_TIMEOUT_MS) {
  const config = getSupabaseServiceConfig()
  if (!config) {
    return null
  }

  return createClient(config.url, config.serviceRoleKey, {
    global: {
      fetch: (input, init) => fetchWithTimeout(input, init, timeoutMs),
    },
  })
}

export function isAbortError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  )
}
