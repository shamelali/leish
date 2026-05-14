import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSql } from "@/lib/db/postgres"

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments", active: true },
  { href: "/admin/moderation", label: "Moderation" },
]

export default async function AdminPaymentsPage() {
  const [paymentRows, recentPayments] = await Promise.all([
    (await getSql()`
      select gateway, status, count(*) as count
      from public.payments
      group by gateway, status
      order by gateway
    `) as {
      gateway: string
      status: string | null
      count: number
    }[],
    (await getSql()`
      select pay.id, pay.gateway, pay.amount_myr, pay.status, pay.created_at,
             prov.display_name as provider_name
      from public.payments pay
      left join public.providers prov on prov.id = pay.provider_id
      order by pay.created_at desc
      limit 30
    `) as {
      id: string
      gateway: string
      amount_myr: number | null
      status: string | null
      created_at: string
      provider_name: string | null
    }[],
  ])

  const paymentStats = paymentRows.reduce((acc: Record<string, { total: number; paid: number }>, row) => {
    const gateway = row.gateway || "Unknown"
    if (!acc[gateway]) acc[gateway] = { total: 0, paid: 0 }
    acc[gateway].total += Number(row.count)
    if (row.status && ["paid", "paid_full", "paid_deposit"].includes(row.status)) {
      acc[gateway].paid += Number(row.count)
    }
    return acc
  }, {})

  const paymentHealth = Object.entries(paymentStats).map(([gateway, stats]) => ({
    gateway,
    status: stats.paid > 0 ? "Operational" : "No paid transactions",
    successRate: stats.total > 0 ? `${Math.round((stats.paid / stats.total) * 100)}%` : "n/a",
  }))

  return (
    <DashboardShell title="Payments" subtitle="Gateway health, settlement monitoring, and payment incident response." nav={NAV}>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Gateway Health">
          <div className="space-y-3">
            {paymentHealth.map((g) => (
              <div key={g.gateway} className="border border-border bg-background p-4">
                <div className="flex items-center justify-between">
                  <p className="font-serif text-base text-foreground">{g.gateway}</p>
                  <p className="font-mono text-xs text-muted-foreground">{g.status}</p>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">Success rate: {g.successRate}</p>
              </div>
            ))}
            {paymentHealth.length === 0 && (
              <p className="text-sm text-muted-foreground">No payment data yet.</p>
            )}
          </div>
        </Panel>

        <Panel title="Ops Checklist">
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Verify webhook delivery success for Billplz.</li>
            <li>Reconcile <code>public.payments</code> against provider dashboards daily.</li>
            <li>Escalate repeated <code>payment_failed</code> events above threshold.</li>
            <li>Audit disputed bookings and attach evidence in booking events.</li>
          </ul>
        </Panel>
      </div>

      <div className="mt-6">
        <Panel title={`Recent Transactions (${recentPayments.length})`}>
          <div className="space-y-2">
            {recentPayments.map((p) => (
              <div key={p.id} className="grid grid-cols-1 gap-3 border border-border bg-background p-3 md:grid-cols-5">
                <p className="self-center font-mono text-xs text-muted-foreground">{p.id.slice(0, 8)}</p>
                <p className="self-center text-sm text-foreground">{p.provider_name ?? "—"}</p>
                <p className="self-center font-mono text-xs uppercase text-muted-foreground">{p.gateway}</p>
                <p className="self-center font-mono text-sm text-accent">
                  {p.amount_myr ? `MYR ${p.amount_myr}` : "—"}
                </p>
                <p className="self-center font-mono text-xs text-muted-foreground">{p.status ?? "—"}</p>
              </div>
            ))}
            {recentPayments.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">No transactions yet.</p>
            )}
          </div>
        </Panel>
      </div>
    </DashboardShell>
  )
}
