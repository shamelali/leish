import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export const metadata = {
  title: "System Monitoring | Leish Admin",
  description: "Monitor system health, webhooks, and cron jobs.",
}

export default async function AdminMonitoringPage() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) redirect("/sign-in")

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  // Verify admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") redirect("/")

  // Get monitoring stats (last 24 hours)
  const { data: stats } = await supabase.rpc("get_monitoring_stats", {
    p_hours: 24,
  })

  // Get recent logs
  const { data: recentLogs } = await supabase
    .from("monitoring_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50)

  // Calculate summary
  const totalChecks = stats?.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.total_checks), 0) || 0
  const okChecks = stats?.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.ok_count), 0) || 0
  const alertChecks = stats?.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.alert_count), 0) || 0
  const errorChecks = stats?.reduce((sum: number, s: Record<string, unknown>) => sum + Number(s.error_count), 0) || 0

  const summaryStats = [
    { label: "Total Checks", value: String(totalChecks), hint: "Last 24 hours" },
    { label: "Healthy", value: String(okChecks), hint: "Normal operation" },
    { label: "Alerts", value: String(alertChecks), hint: "Requires attention" },
    { label: "Errors", value: String(errorChecks), hint: "Failed checks" },
  ]

  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/providers", label: "Providers" },
    { href: "/admin/moderation", label: "Moderation" },
    { href: "/admin/monitoring", label: "Monitoring", active: true },
  ]

  return (
    <DashboardShell
      title="System Monitoring"
      subtitle="Monitor system health, webhook deliveries, and cron job status."
      nav={nav}
    >
      <StatGrid stats={summaryStats} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Monitoring Stats by Type */}
        <Panel title="Monitoring Stats (24h)">
          <div className="space-y-3">
            {stats && stats.length > 0 ? (
              stats.map((stat: Record<string, unknown>) => (
                <div
                  key={stat.check_type as string}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-4"
                >
                  <div>
                    <p className="font-medium text-foreground capitalize">
                      {(stat.check_type as string).replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last check: {new Date(stat.last_check as string).toLocaleString("en-MY")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="font-mono text-sm text-emerald-600">
                        {String(stat.ok_count)} OK
                      </p>
                    </div>
                    {Number(stat.alert_count) > 0 && (
                      <div>
                        <p className="font-mono text-sm text-amber-600">
                          {String(stat.alert_count)} Alerts
                        </p>
                      </div>
                    )}
                    {Number(stat.error_count) > 0 && (
                      <div>
                        <p className="font-mono text-sm text-red-600">
                          {String(stat.error_count)} Errors
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No monitoring data available yet.
              </p>
            )}
          </div>
        </Panel>

        {/* Recent Logs */}
        <Panel title="Recent Logs">
          <div className="max-h-125 overflow-y-auto space-y-2">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 rounded-lg border border-border bg-background p-3"
                >
                  {log.status === "ok" && (
                    <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-500" />
                  )}
                  {log.status === "alert" && (
                    <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" />
                  )}
                  {log.status === "error" && (
                    <XCircle className="mt-0.5 h-4 w-4 text-red-500" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground capitalize">
                        {log.check_type.replace(/_/g, " ")}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString("en-MY")}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="mt-1 text-xs text-muted-foreground overflow-x-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No logs available yet.
              </p>
            )}
          </div>
        </Panel>
      </div>

      {/* Manual Actions */}
      <div className="mt-6">
        <Panel title="Manual Actions">
          <div className="flex flex-wrap gap-3">
            <form action={async () => {
              "use server"
              const supabase = await getSupabaseSsrClient()
              if (supabase) {
                await supabase.rpc("cleanup_old_monitoring_logs")
              }
            }}>
              <button
                type="submit"
                className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
              >
                Cleanup Old Logs (&gt;30 days)
              </button>
            </form>
            
            <a
              href="/api/cron/webhook-monitor"
              target="_blank"
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
            >
              Run Webhook Monitor
            </a>
            
            <a
              href="/api/cron/booking-cleanup"
              target="_blank"
              className="rounded-full border border-border px-4 py-2 text-sm text-muted-foreground hover:border-accent hover:text-accent"
            >
              Run Booking Cleanup
            </a>
          </div>
        </Panel>
      </div>
    </DashboardShell>
  )
}
