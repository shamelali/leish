"use client"

import { useEffect, useState } from "react"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { ProviderPhotoUpload } from "@/components/provider-photo-upload"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export default function StudioPhotosPage() {
  const [providerId, setProviderId] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) return
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: studio } = await supabase
        .from("providers")
        .select("id")
        .eq("owner_id", user.id)
        .eq("kind", "studio")
        .maybeSingle()
      if (studio) setProviderId(studio.id)
    }
    load()
  }, [])

  const nav = [
    { href: "/studio", label: "Overview" },
    { href: "/studio/photos", label: "Photos", active: true },
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
