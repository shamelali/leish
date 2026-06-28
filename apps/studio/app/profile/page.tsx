import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { requireRole } from "@leish/shared/lib/auth/require-role"
import { ProProfileForm } from "@/components/pro-profile-form"
import { ProServiceManager } from "@/components/pro-service-manager"
import { ProviderPhotoUpload } from "@/components/provider-photo-upload"

export const metadata: Metadata = {
  title: "Studio Profile | Leish!",
  description: "Manage studio profile and services.",
}

export default async function StudioProfilePage() {
  const supabase = await getSupabaseSsrClient()
  const { user } = await requireRole(supabase, ["studio", "admin"])

  const { data: prov } = await supabase
    .from("providers")
    .select("id, display_name, state, district, is_active")
    .eq("owner_id", user.id)
    .eq("kind", "studio")
    .limit(1)
    .maybeSingle()
  const provider = prov || null
  const providerId = prov?.id || ""

  const nav = [
    { href: "/", label: "Overview" },
    { href: "/bookings", label: "Bookings" },
    { href: "/payments", label: "Payments" },
    { href: "/reviews", label: "Reviews" },
    { href: "/profile", label: "Profile", active: true },
    { href: "/availability", label: "Availability" },
  ]

  return (
    <DashboardShell title="Profile & Services" subtitle="Update studio profile, pricing, and services." nav={nav}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Profile Editor">
            <ProProfileForm initial={provider} />
          </Panel>
        </div>
        <div>
          <Panel title="Specialties">
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </Panel>
          <div className="mt-6">
            <Panel title="Photos">
              {providerId ? <ProviderPhotoUpload providerId={providerId} /> : <p className="text-sm text-muted-foreground">No provider found for your account.</p>}
            </Panel>
          </div>
          <div className="mt-6">
            <Panel title="Services">
              {providerId ? <ProServiceManager providerId={providerId} /> : <p className="text-sm text-muted-foreground">No provider found for your account.</p>}
            </Panel>
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}