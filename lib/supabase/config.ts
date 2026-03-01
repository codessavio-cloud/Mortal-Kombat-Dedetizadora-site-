export interface SupabasePublicConfig {
  url: string
  anonKey: string
}

export interface SupabaseServiceConfig {
  url: string
  serviceRoleKey: string
}

function read(value: string | undefined) {
  const normalized = value?.trim()
  return normalized && normalized.length > 0 ? normalized : null
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  const url = read(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const anonKey = read(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  if (!url || !anonKey) {
    return null
  }

  return { url, anonKey }
}

export function getSupabaseServiceConfig(): SupabaseServiceConfig | null {
  const url = read(process.env.SUPABASE_URL) ?? read(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const serviceRoleKey = read(process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!url || !serviceRoleKey) {
    return null
  }

  return { url, serviceRoleKey }
}

export function isSupabasePublicConfigured() {
  return getSupabasePublicConfig() !== null
}

export function isSupabaseServiceConfigured() {
  return getSupabaseServiceConfig() !== null
}
