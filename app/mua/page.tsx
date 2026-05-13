import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { MuaUpgradeCard } from "@/components/mua-upgrade-card"
import { getProDashboardMock } from "@/lib/dashboard-mocks"

export const metadata = {
  title: "MUA Dashboard | Leish!",
  description: "Manage bookings and upgrade to Leish Pro for advanced tools.",
}

export default function MuaDashboardPage() {
  const data = getProDashboardMock()
  const nav = [
    { href: "/mua", label: "Overview", active: true },
    { href: "/mua/bookings", label: "Bookings" },
    { href: "/mua/profile", label: "Profile" },
    { href: "/artist", label: "Upgrade to Pro" },
  ]

  return (
    <DashboardShell
      title="MUA Dashboard"
      subtitle="Core workspace for makeup artists. Upgrade to Leish Pro for payments analytics, reviews tools, and advanced operations."
      nav={nav}
    >
      <Panel
        title="Upgrade to Leish Pro"
      >
        <MuaUpgradeCard />
      </Panel>

      <div className="mt-6">
        <StatGrid stats={data.stats.slice(0, 3)} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Panel title="Upcoming Bookings">
          <div className="space-y-3">
            {data.upcomingBookings.slice(0, 5).map((b, idx) => (
              <div key={`${b.date}-${b.slot}-${idx}`} className="flex items-center justify-between border border-border bg-background p-3">
                <div>
                  <p className="font-serif text-base text-foreground">{b.date} • {b.slot}</p>
                  <p className="text-xs text-muted-foreground">{b.client} • {b.type}</p>
                </div>
                <p className="font-mono text-sm text-accent">MYR {b.amountMyr}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Starter Profile Snapshot">
          <div className="space-y-2">
            <p className="font-serif text-lg text-foreground">{data.provider.name}</p>
            <p className="text-sm text-muted-foreground">{data.provider.location}</p>
            <p className="text-xs text-muted-foreground">
              Upgrade to Pro to unlock payout tracking, review moderation, and deeper analytics.
            </p>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  )
}
