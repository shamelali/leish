import { createBrowserClient, type CookieOptions } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabasePublicConfig } from "../env"

let browserClient: SupabaseClient | null = null
let cachedUrl: string | null = null
let cachedAnonKey: string | null = null

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321"
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "anon-key-placeholder"
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const config = getSupabasePublicConfig()
  if (!config) return null

  if (browserClient && cachedUrl === config.url && cachedAnonKey === config.anonKey) {
    return browserClient
  }

  browserClient = createBrowserClient(config.url, config.anonKey, {
    cookies: {
      set(name: string, value: string, options?: CookieOptions) {
        document.cookie = `${name}=${value}; domain=.leish.my; path=/; samesite=lax; secure; max-age=${options?.maxAge ?? 3600}`
      },
      get(name: string) {
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
        return match ? decodeURIComponent(match[2]) : undefined
      },
      remove(name: string) {
        document.cookie = `${name}=; domain=.leish.my; path=/; max-age=0`
      },
    },
  })
  cachedUrl = config.url
  cachedAnonKey = config.anonKey
  return browserClient
}
