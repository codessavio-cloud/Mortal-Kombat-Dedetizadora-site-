import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSupabasePublicConfig } from "@/lib/supabase/config"

export async function createClient() {
  const config = getSupabasePublicConfig()
  if (!config) {
    throw new Error("SUPABASE_NOT_CONFIGURED")
  }

  const cookieStore = await cookies()

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // Ignore errors from Server Components
        }
      },
    },
  })
}

export function createServerSupabaseClient() {
  const config = getSupabasePublicConfig()

  if (!config) {
    throw new Error("SUPABASE_NOT_CONFIGURED")
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return []
      },
      setAll() {},
    },
  })
}
