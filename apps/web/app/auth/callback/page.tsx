"use client"

export const dynamic = "force-dynamic"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { handleOAuthCallback } from "@leish/shared/lib/auth/callback"
import { routeUserAfterSignUp } from "@/components/auth/sign-in-helpers"
import type { UserRole } from "@/lib/routing"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    // NEW: Check for sign-up role in URL (email/G signup confirmation)
    const role = searchParams.get("role")
    if (role === "artist" || role === "studio" || role === "customer") {
      router.replace(routeUserAfterSignUp(role as UserRole))
      return
    }

    const supabase = getSupabaseBrowserClient()
    if (!supabase) { router.replace("/sign-in"); return }

    handleOAuthCallback(supabase).then(({ redirect }) => {
      router.replace(redirect)
    }).catch((e) => {
      console.error("[Leish] Auth callback error:", e)
      router.replace("/")
    })
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Completing sign in...</p>
      </div>
    </div>
  )
}
