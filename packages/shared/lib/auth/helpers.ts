import type { UserRole } from "../types"
import { getPostAuthRedirect } from "./routing"

export async function routeUserAfterSignIn(supabase: any, userId: string): Promise<string> {
  if (!userId) return "/sign-in"

  const { data: profile } = await supabase
    .from("profiles").select("role, created_at").eq("id", userId).maybeSingle()

  const rawRole = (profile?.role as string) || "customer"
  const role: UserRole = rawRole === "studio_manager" ? "studio" : (rawRole as UserRole)

  const profileAge = profile?.created_at ? Date.now() - new Date(profile.created_at).getTime() : Infinity
  const isFreshProfile = profileAge < 5 * 60 * 1000
  if (role === "customer" && isFreshProfile) {
    return "/auth/pick-role"
  }

  const kind = role === "artist" ? "artist" : "studio"
  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase.from("providers").select("id, slug").eq("owner_id", userId).eq("kind", kind).maybeSingle()

  return getPostAuthRedirect(role, !!provider)
}

export function routeUserAfterSignUp(role: UserRole) {
  if (role === "artist") return "/artist/onboarding"
  if (role === "studio") return "/studio/onboarding"
  return getPostAuthRedirect(role, false)
}
