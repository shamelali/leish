import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { getAdminDashboardData } from "@/lib/dashboard-simple"
import Link from "next/link"

export const metadata = {
  title: "Admin Dashboard | Leish!",
  description: "Marketplace operations dashboard for admins.",
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData()
  const nav = [
    { href: "/admin", label: "Overview", active: true },
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/moderation", label: "Moderation" },
  ]

  return (
    <DashboardShell
      title="Admin Dashboard"
      subtitle="Admin UI scaffold. Secure access should be enforced with Supabase session + role checks on the server."
      nav={nav}
    >
      <StatGrid stats={data.stats} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Pending Approvals">
            <div className="space-y-3">
              {data.pendingApprovals.map((item, idx) => (
                <div key={`${item.type}-${item.name}-${idx}`} className="flex items-center justify-between border border-border bg-background p-3">
                  <div>
                    <p className="font-serif text-base text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.type} • {item.state}</p>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">{item.submitted}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Recent Bookings">
            <div className="space-y-3">
              {data.recentBookings.map((b) => (
                <div key={b.id} className="border border-border bg-background p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-base text-foreground">{b.id}</p>
                    <p className="font-mono text-xs text-muted-foreground">{b.status}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{b.provider} • {b.customer}</p>
                  <p className="mt-2 font-mono text-sm text-accent">{b.amount}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Image Placeholders">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Manage placeholder images for providers (artists/studios) without profile images.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/admin/placeholders"
                  className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                  </svg>
                  Create Image Placeholder
                </Link>
                <Link
                  href="/admin/providers"
                  className="inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mr-2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  View Providers
                </Link>
              </div>
              <div className="border border-border bg-background p-3">
                <p className="text-xs text-muted-foreground mb-2">Available Placeholders:</p>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">/artists/placeholder.jpg</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-4" />
                        <path d="M9 9v.01" />
                        <path d="M9 12v.01" />
                        <path d="M9 15v.01" />
                        <path d="M9 18v.01" />
                      </svg>
                    </div>
                    <span className="text-xs font-mono text-muted-foreground">/studios/placeholder.jpg</span>
                  </div>
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Security Notes">
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Use `/sign-in` with Supabase Auth for authentication.</li>
              <li>Grant admin access by setting `public.profiles.role = &apos;admin&apos;` in Supabase.</li>
              <li>Protect `/admin` with a server-side session + role check before production.</li>
            </ul>
          </Panel>

          <Panel title="Payment Health">
            <div className="space-y-3">
              {data.paymentHealth.map((g) => (
                <div key={g.gateway} className="border border-border bg-background p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-serif text-base text-foreground">{g.gateway}</p>
                    <p className="font-mono text-xs text-muted-foreground">{g.status}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Success rate: {g.successRate}</p>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Flagged Reviews">
            <div className="space-y-3">
              {data.flaggedReviews.map((r, idx) => (
                <div key={`${r.provider}-${r.author}-${idx}`} className="border border-border bg-background p-3">
                  <p className="font-serif text-base text-foreground">{r.provider}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.author}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{r.reason}</p>
                  <p className="mt-2 font-mono text-xs text-accent">{r.status}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}
