"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { handleAuthCallback } from "@leish/shared/lib/auth/callback"
import { Loader2 } from "lucide-react"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const role = searchParams.get("role")
    if (role === "artist" || role === "studio" || role === "customer") {
      sessionStorage.setItem("pendingOAuthRole", role)
      document.cookie = `pendingOAuthRole=${encodeURIComponent(role)};path=/;max-age=600;samesite=none;secure`
    }

    handleAuthCallback().then(({ redirect }) => {
      let target = redirect
      if (redirect.startsWith("/artist/")) {
        target = `https://artist.leish.my${redirect.replace("/artist", "") || "/"}`
      } else if (redirect.startsWith("/studio/")) {
        target = `https://studio.leish.my${redirect === "/studio/dashboard" ? "" : redirect.replace("/studio", "") || "/"}`
      }
      router.replace(target)
    }).catch((e) => {
      console.error("[Leish] Auth callback error:", e)
      router.replace("/sign-in?error=auth_failed")
    })
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-sm text-muted-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}
