import type { UserRole } from "../types"
import { getPostAuthRedirect } from "./routing"

export async function routeUserAfterSignIn(supabase: any, userId: string): Promise<string> {
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (aal?.currentLevel === "aal1" && aal?.nextLevel === "aal2") {
    return "/sign-in/mfa"
  }

  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", userId).maybeSingle()

  const role = (profile?.role as UserRole) || "customer"
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
