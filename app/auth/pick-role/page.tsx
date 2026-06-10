"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { getPostAuthRedirect, type UserRole } from "@/lib/routing"
import { RoleSelectDialog } from "@/components/auth/role-select-dialog"
import { Loader2 } from "lucide-react"

export default function PickRolePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()
    if (!supabase) { router.replace("/sign-in"); return }

    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) { router.replace("/sign-in"); return }
      setLoading(false)
    })
  }, [router])

  const handleRoleSelect = async (role: UserRole) => {
    setLoading(true)
    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    await supabase.from("profiles").update({ role }).eq("id", (await supabase.auth.getUser()).data.user?.id ?? "")

    const kind = role === "artist" ? "artist" : "studio"
    const { data: provider } = role === "customer" || role === "admin"
      ? { data: null }
      : await supabase.from("providers").select("id").eq("owner_id", (await supabase.auth.getUser()).data.user?.id ?? "").eq("kind", kind).maybeSingle()

    router.replace(getPostAuthRedirect(role, !!provider))
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
        open={true}
        onOpenChange={() => router.replace("/account")}
        onSelect={handleRoleSelect}
      />
    </div>
  )
}
