import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { getSupabasePublicConfig } from "@/lib/env"

export function getSupabaseServerClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig()
  if (!config) {
    console.error("[supabase/server] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY")
    return null
  }

  return createClient(config.url, config.anonKey, { auth: { persistSession: false } })
}
