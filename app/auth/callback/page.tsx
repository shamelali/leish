"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

type UserRole = "admin" | "artist" | "studio" | "customer"

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":          return "/admin"
    case "artist":         return "/artist"
    case "studio": return "/studios/dashboard"
    case "customer":
    default:               return "/account"
  }
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
        const code = new URLSearchParams(window.location.search).get("code")
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) { console.error("Code exchange error:", error); router.replace("/sign-in"); return }
        }

        // Wait for session to propagate
        await new Promise<void>((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) { subscription.unsubscribe(); resolve() }
          })
          setTimeout(resolve, 3000)
        })

        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) { router.replace("/sign-in"); return }

        // Read role with retry (DB trigger may not have fired yet)
        let role: UserRole = "customer"
        for (let i = 0; i < 3; i++) {
          const { data: profile } = await supabase
            .from("profiles").select("role").eq("id", user.id).maybeSingle()
          if (profile?.role) {
            const r = profile.role as UserRole
            if (["admin","artist","studio"].includes(r)) role = r
            break
          }
          await new Promise(r => setTimeout(r, 600))
        }

        // Check onboarding status for artist/studio roles
        if (role === "artist") {
          const { data: provider } = await supabase
            .from("providers").select("id").eq("owner_id", user.id).eq("kind", "artist").maybeSingle()
          router.replace(provider ? "/artist" : "/artistonboard")
        } else if (role === "studio") {
          const { data: provider } = await supabase
            .from("providers").select("id").eq("owner_id", user.id).eq("kind", "studio").maybeSingle()
          router.replace(provider ? "/studios/dashboard" : "/studioonboard")
        } else {
          router.replace(getRedirectPath(role))
        }
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
