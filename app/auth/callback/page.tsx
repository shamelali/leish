"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

type UserRole = "admin" | "artist" | "studio_manager" | "customer"

async function getUserRole(supabase: NonNullable<ReturnType<typeof getSupabaseBrowserClient>>): Promise<UserRole> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return "customer"

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role as UserRole
  if (role === "admin" || role === "artist" || role === "studio_manager") {
    return role
  }
  return "customer"
}

function getRedirectPath(role: UserRole): string {
  switch (role) {
    case "admin":
      return "/admin"
case "artist":
      return "/artist"
    case "studio_manager":
      return "/studios/onboarding"
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
      return
    }

    const handleCallback = async () => {
      // Wait a moment for auth state to settle
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError) {
        console.error("Session error:", sessionError)
        router.replace("/sign-in")
        return
      }

      if (!session) {
        console.log("No session found, redirecting to sign-in")
        router.replace("/sign-in")
        return
      }

      try {
        const userRole = await getUserRole(supabase)
        console.log("User role detected:", userRole)
        const redirectTo = getRedirectPath(userRole)
        console.log("Redirecting to:", redirectTo)
        router.replace(redirectTo)
        router.refresh()
      } catch (error) {
        console.error("Error getting user role:", error)
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
