export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { ProAvailabilityManager } from "@/components/pro-availability-manager"

export const metadata = {
  title: "Pro Availability | Leish!",
  description: "Manage availability and blocked times.",
}

export default async function ProAvailabilityPage() {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("https://www.leish.my/sign-in")

  const { data: prov } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
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
