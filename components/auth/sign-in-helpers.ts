import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"

export async function routeUserAfterSignIn(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>, userId: string): Promise<string> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    return "/sign-in/mfa"
  }

  const { data: profile } = await supabase
    .from("profiles").select("role, created_at").eq("id", userId).maybeSingle()

  const role = (profile?.role as UserRole) || "customer"

  const profileAge = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : Infinity
  const isFreshProfile = profileAge < 5 * 60 * 1000
  if (role === "customer" && isFreshProfile) {
    return "/auth/pick-role"
  }

  const kind = role === "artist" ? "artist" : "studio"
  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase.from("providers").select("id, slug").eq("owner_id", userId).eq("kind", kind).maybeSingle()

  return getPostAuthRedirect(role, !!provider, (provider as { slug?: string } | null)?.slug)
}

export function routeUserAfterSignUp(role: UserRole) {
  if (role === "artist") return "/artist/onboarding"
  if (role === "studio") return "/studio/onboarding"
  return getPostAuthRedirect(role, false)
}
