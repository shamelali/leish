export const dynamic = "force-dynamic"

import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { ProAvailabilityManager } from "@/components/pro-availability-manager"

export const metadata = {
  title: "Studio Availability | Leish!",
  description: "Manage availability and blocked times.",
}

export default async function StudioAvailabilityPage() {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="p-8">Not authenticated</p>

  const { data: prov } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .eq("kind", "studio")
    .limit(1)
    .maybeSingle()
  const providerId = prov?.id || ""

  const nav = [
    { href: "/", label: "Overview" },
    { href: "/bookings", label: "Bookings" },
    { href: "/payments", label: "Payments" },
    { href: "/reviews", label: "Reviews" },
    { href: "/profile", label: "Profile" },
    { href: "/availability", label: "Availability", active: true },
  ]

  return (
    <DashboardShell title="Availability" subtitle="Set recurring schedules and manage blocked dates." nav={nav}>
      <Panel title="Manage Slots">
        {providerId ? <ProAvailabilityManager providerId={providerId} /> : <p className="text-sm text-muted-foreground">No provider found for your account.</p>}
      </Panel>
    </DashboardShell>
  )
}