import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { getProDashboardData } from "@/lib/dashboard"

const nav = [
  { href: "/artist", label: "Overview" },
  { href: "/artist/bookings", label: "Bookings" },
  { href: "/artist/payments", label: "Payments", active: true },
  { href: "/artist/reviews", label: "Reviews" },
  { href: "/artist/profile", label: "Profile" },
  { href: "/artist/availability", label: "Availability" },
]

export default async function ProPaymentsPage() {
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

  const data = prov?.id ? await getProDashboardData() : { payouts: [], stats: [] }

  const earningsStat = data.stats?.find((s) => s.label === "Earnings (MTD)")
  const totalStat = data.stats?.find((s) => s.label === "Total Earnings")

  return (
    <DashboardShell title="Payments & Payouts" subtitle="Track successful payments, pending settlements, and payout history." nav={nav}>
      {/* Earnings summary */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {earningsStat && (
          <div className="border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{earningsStat.label}</p>
            <p className="mt-1 font-serif text-2xl text-accent">{earningsStat.value}</p>
          </div>
        )}
        {totalStat && (
          <div className="border border-border bg-card p-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{totalStat.label}</p>
            <p className="mt-1 font-serif text-2xl text-foreground">{totalStat.value}</p>
          </div>
        )}
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Platform Fee</p>
          <p className="mt-1 font-serif text-2xl text-foreground">8%</p>
          <p className="text-xs text-muted-foreground">per transaction</p>
        </div>
      </div>

      <Panel title={`Payout History (${data.payouts.length})`}>
        <div className="space-y-2">
          {data.payouts.map((p) => (
            <div key={p.period} className="grid grid-cols-1 gap-3 border border-border bg-background p-4 md:grid-cols-5">
              <p className="font-serif text-base text-foreground">{p.period}</p>
              <p className="self-center font-mono text-sm text-muted-foreground">{p.gross}</p>
              <p className="self-center font-mono text-sm text-muted-foreground">fees {p.fees}</p>
              <p className="self-center font-mono text-sm text-accent">{p.net}</p>
              <p className="self-center text-xs text-muted-foreground">{p.status}</p>
            </div>
          ))}
          {data.payouts.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No payouts yet.</p>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
