import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSql } from "@/lib/db/postgres"

export const dynamic = "force-dynamic"
import { approveReview, hideReview, escalateReview } from "@/lib/actions/admin"

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/providers", label: "Providers" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/moderation", label: "Moderation", active: true },
]

export default async function AdminModerationPage() {
  const rows = (await getSql()`
    select r.id,
           r.flag_reason,
           r.status,
           prov.display_name as provider_name,
           reviewer.email as reviewer_email
    from public.reviews r
    left join public.providers prov on prov.id = r.provider_id
    left join public.profiles reviewer on reviewer.id = r.reviewer_id
    where r.status = 'flagged'
    order by r.created_at desc
    limit 20
  `) as {
    id: string
    flag_reason: string | null
    status: string
    provider_name: string | null
    reviewer_email: string | null
  }[]

  return (
    <DashboardShell title="Moderation" subtitle="Review flagged reviews, profile updates, and marketplace policy issues." nav={NAV}>
      <Panel title={`Flagged Reviews Queue (${rows.length})`}>
        <div className="space-y-3">
          {rows.map((r) => (
            <div key={r.id} className="border border-border bg-background p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="font-serif text-base text-foreground">{r.provider_name ?? "—"}</p>
                <span className="font-mono text-[10px] uppercase text-accent">{r.status}</span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Author: {r.reviewer_email ?? "—"}</p>
              <p className="mt-2 text-sm text-muted-foreground">{r.flag_reason ?? "Reported by user"}</p>
              <div className="mt-3 flex gap-2">
                <form action={approveReview.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="border border-border px-3 py-2 text-xs text-foreground hover:border-emerald-500 hover:text-emerald-600"
                  >
                    Approve
                  </button>
                </form>
                <form action={hideReview.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="border border-border px-3 py-2 text-xs text-foreground hover:border-yellow-500 hover:text-yellow-600"
                  >
                    Hide
                  </button>
                </form>
                <form action={escalateReview.bind(null, r.id)}>
                  <button
                    type="submit"
                    className="border border-border px-3 py-2 text-xs text-foreground hover:border-red-500 hover:text-red-600"
                  >
                    Escalate
                  </button>
                </form>
              </div>
            </div>
          ))}
          {rows.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No flagged reviews. Queue is clear.</p>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
