import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublicConfig } from "../env"

export function getSupabaseServerClient(): SupabaseClient {
  const config = getSupabasePublicConfig()
  if (!config) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY — check .env.local")
  }
  return createClient(config.url, config.anonKey, { auth: { persistSession: false } })
}
