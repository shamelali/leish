"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

type UserRole = "admin" | "artist" | "studio_manager" | "customer"

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
    case "artist":
      return "/artist"
    case "studio_manager":
      return "/studioonboard"
    case "customer":
    default:
      return "/"
  }
}

export default function AuthCallbackPage() {
  const router = useRouter()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      router.replace("/sign-in")
      return
    }

    const handleCallback = async () => {
      try {
        // Step 1: exchange the OAuth code/hash for a real session
        // This handles both PKCE code (search params) and implicit hash tokens
        const searchParams = new URLSearchParams(window.location.search)
        const code = searchParams.get("code")

        if (code) {
          // PKCE flow — exchange code for session
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) {
            console.error("Code exchange error:", error)
            router.replace("/sign-in")
            return
          }
        }

        // Step 2: wait for auth state to fully propagate
        await new Promise<void>((resolve) => {
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === "SIGNED_IN" && session) {
              subscription.unsubscribe()
              resolve()
            }
          })
          // Fallback timeout — resolve after 3s regardless
          setTimeout(resolve, 3000)
        })

        // Step 3: get the verified user (not cached)
        const { data: { user }, error: userError } = await supabase.auth.getUser()

        if (userError || !user) {
          console.error("No user after callback:", userError)
          router.replace("/sign-in")
          return
        }

        // Step 4: read role from profiles with retry
        let role: UserRole = "customer"
        for (let attempt = 0; attempt < 3; attempt++) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .maybeSingle()

          if (profile?.role) {
            const r = profile.role as UserRole
            if (r === "admin" || r === "artist" || r === "studio_manager") {
              role = r
            }
            break
          }
          // Profile not ready yet — wait and retry
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        // Step 4b: for artists, check if they have a provider row
        let redirectPath = getRedirectPath(role)
        if (role === "artist") {
          const { data: provider } = await supabase
            .from("providers")
            .select("id")
            .eq("owner_id", user.id)
            .eq("kind", "artist")
            .maybeSingle()
          if (!provider) {
            redirectPath = "/artistonboard"
          }
        }

        // Step 4c: for studio managers, check if they have a studio
        if (role === "studio_manager") {
          const { data: studio } = await supabase
            .from("providers")
            .select("id")
            .eq("owner_id", user.id)
            .eq("kind", "studio")
            .maybeSingle()
          redirectPath = studio ? "/studios/dashboard" : "/studioonboard"
        }

        console.log("[Leish] Auth callback — user:", user.email, "role:", role, "redirect:", redirectPath)
        router.replace(redirectPath)

      } catch (error) {
        console.error("[Leish] Auth callback error:", error)
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
