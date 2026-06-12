"use client"

export const dynamic = "force-dynamic"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"
import { Loader2 } from "lucide-react"
import { RoleSelectDialog } from "@/components/auth/role-select-dialog"

export default function PickRolePage() {
  const router = useRouter()
  const processed = useRef(false)
  const [showDialog, setShowDialog] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleRoleSelect = async (role: UserRole) => {
    if (processed.current) return
    processed.current = true
    setLoading(true)

  // Store role in cookie and sessionStorage before sign-in
    sessionStorage.setItem("pendingOAuthRole", role)
    document.cookie = `pendingOAuthRole=${encodeURIComponent(role)};path=/;max-age=600;samesite=none;secure`

    const supabase = getSupabaseBrowserClient()
    if (!supabase) { router.replace("/sign-up"); return }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      // Not signed in — redirect to sign-up; role is stored in cookie
      router.replace("/sign-up")
      return
    }

    // Already signed in — update profile and redirect
    const userId = user.id
    await supabase.from("profiles").update({ role }).eq("id", userId).maybeSingle()

    const kind = role === "artist" ? "artist" : "studio"
    const { data: provider } = role === "customer" || role === "admin"
      ? { data: null }
      : await supabase.from("providers").select("id, slug").eq("owner_id", userId).eq("kind", kind).maybeSingle()

    // Clean up
    sessionStorage.removeItem("pendingOAuthRole")
    document.cookie = "pendingOAuthRole=;path=/;max-age=0"

    router.replace(getPostAuthRedirect(role, !!provider, (provider as { slug?: string } | null)?.slug))
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <RoleSelectDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open)
          if (!open) router.replace("/")
        }}
        onSelect={handleRoleSelect}
      />
    </div>
  )
}
