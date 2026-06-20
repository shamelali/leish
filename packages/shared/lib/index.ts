// Auth
export { getSupabaseBrowserClient, supabase } from "./auth/client"
export { getSupabaseServerClient } from "./auth/server"
export { getSupabaseSsrClient } from "./auth/ssr"
export { updateSession } from "./auth/middleware"
export { getPostAuthRedirect } from "./auth/routing"
export { routeUserAfterSignIn, routeUserAfterSignUp } from "./auth/helpers"
export { waitForSession, waitForProfile, resolveUserRole, cleanupPendingRole, getProviderInfo, handleAuthCallback } from "./auth/callback"

// Utils
export { cn } from "./utils"

// Env
export { getSupabasePublicConfig, getEnv, requireDatabaseUrl, getStudioSource, getExternalStudioApiConfig } from "./env"

// Types
export type { UserRole } from "./types"

// i18n
export { LanguageProvider, useLanguage, useTranslation } from "./i18n/context"
export type { Language } from "./i18n/translations"
