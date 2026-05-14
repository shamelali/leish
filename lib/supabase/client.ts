import { createBrowserClient } from "@supabase/ssr"
import { type SupabaseClient } from "@supabase/supabase-js"

import { getSupabasePublicConfig } from "@/lib/env"

let browserClient: SupabaseClient | null = null
let cachedUrl: string | null = null
let cachedAnonKey: string | null = null

// Server‑side client (used in API routes & tests)
// Fallback values allow the test suite to run without real Supabase credentials.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon-key-placeholder"
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig()
  if (!config) {
    return null
  }

  if (
    browserClient &&
    cachedUrl === config.url &&
    cachedAnonKey === config.anonKey
  ) {
    return browserClient
  }

  browserClient = createBrowserClient(config.url, config.anonKey)
  cachedUrl = config.url
  cachedAnonKey = config.anonKey
  return browserClient
}
