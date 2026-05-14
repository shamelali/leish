import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSql } from "@/lib/db/postgres"
import { adminCancelBooking, adminConfirmBooking } from "@/lib/actions/admin"

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/bookings", label: "Bookings", active: true },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/moderation", label: "Moderation" },
]

const STATUS_COLORS: Record<string, string> = {
  pending: "text-yellow-600 dark:text-yellow-400",
  confirmed: "text-blue-600 dark:text-blue-400",
  paid_deposit: "text-emerald-600 dark:text-emerald-400",
  paid_full: "text-emerald-600 dark:text-emerald-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  canceled: "text-red-500 dark:text-red-400",
}

export default async function AdminBookingsPage() {
  const rows = (await getSql()`
    select b.id,
           b.status,
           b.total_amount_myr,
           b.created_at,
           prov.display_name as provider_name,
           prof.email as customer_email
    from public.bookings b
    left join public.providers prov on prov.id = b.provider_id
    left join public.profiles prof on prof.id = b.customer_id
    order by b.created_at desc
    limit 20
  `) as {
    id: string
    status: string
    total_amount_myr: number | null
    created_at: string
    provider_name: string | null
    customer_email: string | null
  }[]

  return (
    <DashboardShell title="Bookings Operations" subtitle="Review booking pipeline, anomalies, and dispute handling." nav={NAV}>
      <Panel title={`Recent Bookings (${rows.length})`}>
        <div className="space-y-3">
          {rows.map((b) => (
            <div key={b.id} className="grid grid-cols-1 gap-3 border border-border bg-background p-4 md:grid-cols-6">
              <p className="self-center font-mono text-xs text-muted-foreground">{b.id.slice(0, 8)}</p>
              <p className="self-center font-serif text-sm text-foreground">{b.provider_name ?? "—"}</p>
              <p className="self-center text-xs text-muted-foreground">{b.customer_email ?? "—"}</p>
              <p className="self-center font-mono text-sm text-accent">{b.total_amount_myr ? `MYR ${b.total_amount_myr}` : "—"}</p>
              <span className={`self-center font-mono text-xs ${STATUS_COLORS[b.status] ?? "text-muted-foreground"}`}>
                {b.status}
              </span>
              <div className="flex gap-2">
                {b.status === "pending" && (
                  <form action={adminConfirmBooking.bind(null, b.id)}>
                    <button
                      type="submit"
                      className="border border-border px-3 py-2 text-xs text-foreground hover:border-emerald-500 hover:text-emerald-600"
                    >
                      Confirm
                    </button>
                  </form>
                )}
                {!["canceled", "completed"].includes(b.status) && (
                  <form action={adminCancelBooking.bind(null, b.id)}>
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
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No bookings yet.</p>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
