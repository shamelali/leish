import type { UserRole } from "../types"
import { getPostAuthRedirect } from "./routing"

export async function waitForSession(
  supabase: any,
  retries = 10,
  delay = 500,
) {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user) return data.session.user
    await new Promise(r => setTimeout(r, delay))
  }
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function waitForProfile(
  supabase: any,
  userId: string,
  retries = 5,
  delay = 600,
) {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase
      .from("profiles").select("role").eq("id", userId).maybeSingle()
    if (data?.role) return data as { role: string }
    await new Promise(r => setTimeout(r, delay))
  }
  return null
}

export async function resolveUserRole(
  supabase: any,
  user: any,
  profile: { role: string } | null
): Promise<UserRole> {
  let role: UserRole = "customer"
  if (profile) {
    const r = profile.role as UserRole
    if (["admin", "artist", "studio"].includes(r)) role = r
  }

  let pendingRole: UserRole | null = null
  const ss = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("pendingOAuthRole") : null
  if (ss && ["artist", "studio", "customer"].includes(ss)) {
    pendingRole = ss as UserRole
  } else {
    const stored = document.cookie.split(";").find(c => c.trim().startsWith("pendingOAuthRole="))
    const raw = stored ? decodeURIComponent(stored.split("=")[1]) : null
    if (raw && ["artist", "studio", "customer"].includes(raw)) {
      pendingRole = raw as UserRole
    }
  }

  if (pendingRole && pendingRole !== "customer" && role === "customer" && profile) {
    role = pendingRole
    await supabase.from("profiles").update({ role: pendingRole }).eq("id", user.id)
  }

  return role
}

export function cleanupPendingRole() {
  try { sessionStorage.removeItem("pendingOAuthRole") } catch {}
  document.cookie = "pendingOAuthRole=;path=/;max-age=0;samesite=none;secure"
}

export async function getProviderInfo(
  supabase: any,
  userId: string,
  role: UserRole
) {
  if (role === "customer" || role === "admin") return null
  const kind = role === "artist" ? "artist" : "studio"
  const { data } = await supabase
    .from("providers")
    .select("id, slug")
    .eq("owner_id", userId)
    .eq("kind", kind)
    .maybeSingle()
  return data
}

export async function handleOAuthCallback(supabase: any) {
  const user = await waitForSession(supabase)
  if (!user) return { redirect: "/sign-in" }

  const profile = await waitForProfile(supabase, user.id)
  const role = await resolveUserRole(supabase, user, profile)
  cleanupPendingRole()

  const provider = await getProviderInfo(supabase, user.id, role)
  return { redirect: getPostAuthRedirect(role, !!provider, (provider as { slug?: string } | null)?.slug) }
}
