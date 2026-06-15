import { z } from "zod"

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  DATABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
})

type AppEnv = z.infer<typeof EnvSchema>

export function getEnv(): AppEnv {
  return EnvSchema.parse(process.env)
}

export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function requireDatabaseUrl() {
  const env = getEnv()
  if (!env.DATABASE_URL) throw new Error("Missing DATABASE_URL")
  return env.DATABASE_URL
}
