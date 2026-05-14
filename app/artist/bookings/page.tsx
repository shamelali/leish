import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { getProDashboardData } from "@/lib/dashboard"
import { proConfirmBooking, proCancelBooking } from "@/lib/actions/pro"

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 dark:text-yellow-400",
  confirmed: "text-blue-600 dark:text-blue-400",
  paid_deposit: "text-emerald-600 dark:text-emerald-400",
  paid_full: "text-emerald-600 dark:text-emerald-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  canceled: "text-red-500 dark:text-red-400",
}

export default async function ProBookingsPage() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) return <p className="p-8">Not authenticated</p>

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <p className="p-8">Not authenticated</p>

  const { data: prov } = await supabase
    .from("providers")
    .select("id")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()

  const data = prov?.id ? await getProDashboardData() : { upcomingBookings: [] }

  const nav = [
    { href: "/artist", label: "Overview" },
    { href: "/artist/bookings", label: "Bookings", active: true },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile" },
    { href: "/artist/availability", label: "Availability" },
    { href: "/artist/charges", label: "Charges & Fees" },
  ]

  return (
    <DashboardShell title="Bookings" subtitle="Manage upcoming appointments, statuses, and scheduling changes." nav={nav}>
      <Panel title={`Upcoming Bookings (${data.upcomingBookings.length})`}>
        <div className="space-y-3">
          {data.upcomingBookings.map((b) => (
            <div key={b.id} className="grid grid-cols-1 gap-3 border border-border bg-background p-4 md:grid-cols-5">
              <div>
                <p className="font-serif text-base text-foreground">{b.client || "—"}</p>
                <p className="text-xs text-muted-foreground">{b.type}</p>
              </div>
              <div>
                <p className="font-mono text-sm text-foreground">{b.date}</p>
                <p className="font-mono text-xs text-muted-foreground">{b.slot}</p>
              </div>
              <p className="self-center font-mono text-sm text-accent">MYR {b.amountMyr}</p>
              <span className={`self-center font-mono text-xs ${STATUS_COLORS[b.status] ?? "text-muted-foreground"}`}>
                {b.status}
              </span>
              <div className="flex items-center gap-2">
                {b.status === "pending" && (
                  <form action={proConfirmBooking.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="border border-border px-3 py-2 text-xs text-foreground hover:border-emerald-500 hover:text-emerald-600"
                    >
                      Confirm
                    </button>
                  </form>
                )}
                {["pending", "confirmed"].includes(b.status) && (
                  <form action={proCancelBooking.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="border border-border px-3 py-2 text-xs text-foreground hover:border-red-500 hover:text-red-600"
                    >
                      Cancel
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
          {data.upcomingBookings.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No upcoming bookings.</p>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
