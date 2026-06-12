"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"
import { Loader2 } from "lucide-react"

async function waitForSession(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
  retries = 10,
  delay = 500,
) {
  for (let i = 0; i < retries; i++) {
    const { data } = await supabase.auth.getSession()
    if (data?.session?.user) return data.session.user
    await new Promise(r => setTimeout(r, delay))
  }
  // One final attempt with getUser (which refreshes if needed)
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

async function waitForProfile(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
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

async function resolveUserRole(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
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

function cleanupPendingRole() {
  try {
    sessionStorage.removeItem("pendingOAuthRole")
  } catch {}
  document.cookie = "pendingOAuthRole=;path=/;max-age=0;samesite=none;secure"
}

async function getProviderInfo(
  supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>,
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

export default function AuthCallbackPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const supabase = getSupabaseBrowserClient()
    if (!supabase) { router.replace("/sign-in"); return }

    const handleCallback = async () => {
      try {
        const user = await waitForSession(supabase)
        if (!user) { router.replace("/sign-in"); return }

        const profile = await waitForProfile(supabase, user.id)
        const role = await resolveUserRole(supabase, user, profile)

        cleanupPendingRole()

        const provider = await getProviderInfo(supabase, user.id, role)
        router.replace(getPostAuthRedirect(role, !!provider, provider?.slug))
      } catch (e) {
        console.error("[Leish] Auth callback error:", e)
        router.replace("/")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
