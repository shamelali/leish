"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"
import { Loader2 } from "lucide-react"

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
        // @supabase/ssr createBrowserClient auto-detects the ?code= parameter
        // and handles PKCE exchange. Wait for the session to propagate.
        await new Promise<void>((resolve) => setTimeout(resolve, 2000))

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) { router.replace("/sign-in"); return }

        // Read role with retry (DB trigger may not have fired yet)
        let role: UserRole = "customer"
        let profile: { role: string } | null = null
        for (let i = 0; i < 3; i++) {
          const { data: p } = await supabase
            .from("profiles").select("role").eq("id", user.id).maybeSingle()
          if (p?.role) {
            profile = p
            const r = p.role as UserRole
            if (["admin","artist","studio"].includes(r)) role = r
            break
          }
          await new Promise(r => setTimeout(r, 600))
        }

        // Apply role from Google sign-in dialog selection (new users only)
        // Read selected role from cookie (primary, survives cross-origin redirect) or sessionStorage (fallback)
        const pendingRoleRaw =
          document.cookie.split(";").find(c => c.trim().startsWith("pendingOAuthRole="))
            ?.split("=")[1]
          || sessionStorage.getItem("pendingOAuthRole")
        const pendingRole = (pendingRoleRaw ? decodeURIComponent(pendingRoleRaw) : null) as UserRole | null
        // Clean up both storage mechanisms
        sessionStorage.removeItem("pendingOAuthRole")
        document.cookie = "pendingOAuthRole=;path=/;max-age=0"
        if (pendingRole && pendingRole !== "customer" && role === "customer" && profile) {
          role = pendingRole
          await supabase.from("profiles").update({ role: pendingRole }).eq("id", user.id)
        }

        // Check onboarding status for artist/studio roles
        const kind = role === "artist" ? "artist" : "studio"
        const { data: provider } = role === "customer" || role === "admin"
          ? { data: null }
          : await supabase.from("providers").select("id").eq("owner_id", user.id).eq("kind", kind).maybeSingle()

        router.replace(getPostAuthRedirect(role, !!provider))
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
