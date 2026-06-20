"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { ProviderPhotoUpload } from "@/components/provider-photo-upload"
import { getSupabaseBrowserClient } from "@leish/shared/lib/auth/client"

const ALLOWED_ROLES = ["studio", "admin"]

export default function StudioPhotosPage() {
  const [providerId, setProviderId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/sign-in"); return }

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle()
      if (!profile || !ALLOWED_ROLES.includes(profile.role)) { router.push("/"); return }

      const { data: studio } = await supabase
        .from("providers")
        .select("id")
        .eq("owner_id", user.id)
        .eq("kind", "studio")
        .maybeSingle()
      if (studio) setProviderId(studio.id)
    }
    load()
  }, [router])

  const nav = [
    { href: "/", label: "Overview" },
    { href: "/photos", label: "Photos", active: true },
    { href: "/bookings", label: "Bookings" },
    { href: "/payments", label: "Payments" },
    { href: "/reviews", label: "Reviews" },
    { href: "/profile", label: "Profile" },
    { href: "/availability", label: "Availability" },
  ]

  return (
    <DashboardShell title="Studio Photos" subtitle="Manage your studio's photo gallery" nav={nav}>
      <Panel title="Photo Gallery">
        {providerId ? (
          <ProviderPhotoUpload providerId={providerId} />
        ) : (
          <p className="text-sm text-muted-foreground">Loading...</p>
        )}
      </Panel>
    </DashboardShell>
  )
}
