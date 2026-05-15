import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { ProAvailabilityManager } from "@/components/pro-availability-manager"

export const metadata = {
  title: "Pro Availability | Leish!",
  description: "Manage availability and blocked times.",
}

export default async function ProAvailabilityPage() {
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
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()
  const providerId = prov?.id || ""

  const nav = [
    { href: "/artist", label: "Overview" },
    { href: "/artist/bookings", label: "Bookings" },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile" },
    { href: "/artist/availability", label: "Availability", active: true },
  ]

  return (
    <DashboardShell title="Availability" subtitle="Set recurring schedules and manage blocked dates." nav={nav}>
      <Panel title="Manage Slots">
        {providerId ? <ProAvailabilityManager providerId={providerId} /> : <p className="text-sm text-muted-foreground">No provider found for your account.</p>}
      </Panel>
    </DashboardShell>
  )
}
