export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { proConfirmBooking, proCancelBooking } from "@/lib/actions/pro"

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 dark:text-yellow-400",
  confirmed: "text-blue-600 dark:text-blue-400",
  paid_deposit: "text-emerald-600 dark:text-emerald-400",
  paid_full: "text-emerald-600 dark:text-emerald-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  canceled: "text-red-500 dark:text-red-400",
}

export default async function ArtistBookingsPage() {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const nav = [
    { href: "/artist/dashboard", label: "Overview" },
    { href: "/artist/bookings", label: "Bookings", active: true },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile" },
    { href: "/artist/availability", label: "Availability" },
    { href: "/artist/charges", label: "Charges & Fees" },
  ]

  const { data: prov } = await supabase
    .from("providers").select("id").eq("owner_id", user.id).eq("kind", "artist").maybeSingle()

  if (!prov) {
    return (
      <DashboardShell title="Bookings" subtitle="Manage your incoming and upcoming sessions" nav={nav}>
        <Panel title="No Artist Profile">
          <p className="text-sm text-muted-foreground">Complete your artist onboarding to manage bookings.</p>
        </Panel>
      </DashboardShell>
    )
  }

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`id, status, total_amount_myr, created_at, profiles!customer_id(full_name), services!service_id(name)`)
    .eq("provider_id", prov.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <DashboardShell title="Bookings" subtitle="Manage your incoming and upcoming sessions" nav={nav}>
      <Panel title="All Bookings">
        {bookings && bookings.length > 0 ? (
          <div className="space-y-3">
            {bookings.map((b) => {
              const clientName = (b.profiles as unknown as { full_name?: string })?.full_name ?? "Client"
              const serviceName = (b.services as unknown as { name?: string })?.name ?? "Service"
              return (
                <div key={b.id} className="flex items-center justify-between border border-border bg-background p-4">
                  <div>
                    <p className="font-serif text-base text-foreground">{clientName}</p>
                    <p className="text-xs text-muted-foreground">{serviceName}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className={`font-mono text-xs ${STATUS_COLORS[b.status] ?? ""}`}>{b.status.replace("_", " ")}</p>
                    <p className="font-mono text-sm text-accent">MYR {b.total_amount_myr}</p>
                    {b.status === "pending" && (
                      <form action={proConfirmBooking.bind(null, b.id)}>
                        <button type="submit" className="border border-accent bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent hover:text-accent-foreground">Confirm</button>
                      </form>
                    )}
                    <form action={proCancelBooking.bind(null, b.id)}>
                      <button type="submit" className="border border-border px-3 py-1.5 text-xs text-muted-foreground hover:border-destructive hover:text-destructive">Cancel</button>
                    </form>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No bookings yet.</p>
        )}
      </Panel>
    </DashboardShell>
  )
}
