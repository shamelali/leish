import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"

export async function routeUserAfterSignIn(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>, userId: string) {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    window.location.href = "/sign-in/mfa"
    return
  }

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", userId).maybeSingle()

  const role = (profile?.role as UserRole) || "customer"
  const kind = role === "artist" ? "artist" : "studio"
  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase.from("providers").select("id, slug").eq("owner_id", userId).eq("kind", kind).maybeSingle()

  window.location.href = getPostAuthRedirect(role, !!provider, (provider as { slug?: string } | null)?.slug)
}

export function routeUserAfterSignUp(role: UserRole) {
  if (role === "artist") return "/onboarding"
  if (role === "studio") return "/onboarding"
  return getPostAuthRedirect(role, false)
}
