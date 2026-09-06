export const dynamic = "force-dynamic"

import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { requireRole } from "@leish/shared/lib/auth/require-role"
import { ScheduleManager } from "@/components/schedule-manager"

export const metadata = {
  title: "Studio Schedule | Leish!",
  description: "Manage weekly opening hours, blocked times, bookable resources and booking rules.",
}

export default async function StudioAvailabilityPage() {
  const supabase = await getSupabaseSsrClient()
  const { user } = await requireRole(supabase, ["studio", "admin"])

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
    { href: "/availability", label: "Schedule", active: true },
  ]

  return (
    <DashboardShell
      title="Schedule & Booking Rules"
      subtitle="Weekly opening hours, closures, resources and per-studio booking rules."
      nav={nav}
    >
      <Panel title="Studio Schedule">
        {providerId ? (
          <ScheduleManager providerId={providerId} />
        ) : (
          <p className="text-sm text-muted-foreground">No provider found for your account.</p>
        )}
      </Panel>
    </DashboardShell>
  )
}
