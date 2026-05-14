import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { ProProfileForm } from "@/components/pro-profile-form"
import { ProServiceManager } from "@/components/pro-service-manager"

export const metadata = {
  title: "Pro Profile | Leish!",
  description: "Manage provider profile and services.",
}

export default async function ProProfilePage() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return <p className="p-8">Not authenticated</p>
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return <p className="p-8">Not authenticated</p>
  }

  const { data: prov } = await supabase
    .from("providers")
    .select("id, display_name, state, district, is_active")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()
  const provider = prov || null
  const providerId = prov?.id || ""

  const nav = [
    { href: "/artist", label: "Overview" },
    { href: "/artist/bookings", label: "Bookings" },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile", active: true },
    { href: "/artist/availability", label: "Availability" },
  ]

  return (
    <DashboardShell title="Profile & Services" subtitle="Update profile content, pricing, and specialties." nav={nav}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Panel title="Profile Editor">
            <ProProfileForm initial={provider} />
          </Panel>
        </div>
        <div>
          <Panel title="Specialties">
            {/* specialties are managed via admin; placeholder for now */}
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </Panel>
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
