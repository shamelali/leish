// Auth - server-only
export { getSupabaseServerClient } from "./auth/supabase.server"
// Auth - client and server safe
export { getSupabaseBrowserClient, supabase } from "./auth/client"
export { getSupabaseSsrClient } from "./auth/ssr"
export { signIn, signOut } from "./auth/next-auth"
export { getPostAuthRedirect } from "./auth/routing"
export { routeUserAfterSignIn, routeUserAfterSignUp } from "./auth/helpers"
export { handleAuthCallback } from "./auth/callback"

// Utils
export { cn } from "./utils"

// Env
export { getSupabasePublicConfig, getEnv, requireDatabaseUrl, getStudioSource, getExternalStudioApiConfig } from "./env"

// Types
export type { UserRole } from "./types"

// i18n
export { LanguageProvider, useLanguage, useTranslation } from "./i18n/context"
export type { Language } from "./i18n/translations"

// Malaysia data
export {
  MALAYSIAN_STATES,
  MALAYSIA_DISTRICTS,
  SERVICE_NAMES,
  MALAYSIA_LANGUAGES,
  DURATION_MINUTES_OPTIONS,
  formatDuration,
  formatDurationShort,
} from "./malaysia"
