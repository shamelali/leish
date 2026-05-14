import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabasePublicConfig } from "@/lib/env"

export function getSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig()
  if (!config) {
    console.error("[supabase/server] Missing Supabase public config — check env vars")
    return null
  }

  return createClient(config.url, config.anonKey, { auth: { persistSession: false } })
}
