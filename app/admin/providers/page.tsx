import { redirect } from "next/navigation"
import Link from "next/link"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { activateProvider, suspendProvider, flagProvider } from "@/lib/actions/admin"
import { AlertTriangle, CheckCircle, XCircle, Flag } from "lucide-react"

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams?: { filter?: string; severity?: string }
}) {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return redirect("/sign-in")
  }

  // Verify admin role
  const { data: profile } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profile.user?.id)
    .single()

  if (!userProfile?.role || !["admin", "studio_manager"].includes(userProfile.role)) {
    return redirect("/")
  }

  const filter = searchParams?.filter || "all"
  const severityFilter = searchParams?.severity

  
  const NAV = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/providers", label: "Providers", active: true },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/moderation", label: "Moderation" },
  ]

// Build query based on filters
  let query = supabase.from("providers").select(`
    id,
    kind,
    display_name,
    state,
    district,
    is_active,
    is_suspended,
    tier,
    created_at,
    owner_id,
    provider_alerts!left(
      id,
      severity,
      status
    )
  `)

  // Apply filters
  if (filter === "with-alerts") {
    query = query.not("provider_alerts.id", "is", null)
  } else if (filter === "suspended") {
    query = query.eq("is_suspended", true)
  } else if (filter === "pro") {
    query = query.eq("tier", "pro")
  }

  const { data: providers, error } = await query.order("created_at", { ascending: false })

  if (error) {
    console.error("[admin/providers] error:", error)
    return (
      <DashboardShell title="Providers" subtitle="Manage provider accounts, verify credentials, and handle suspensions." nav={NAV}>
        <Panel title="Error">
          <p className="text-red-600">Failed to load providers. Please try again.</p>
        </Panel>
      </DashboardShell>
    )
  }

  // Count alerts by severity for each provider
  const providersWithAlertCounts = (providers || []).map((p) => {
    const alerts = (p.provider_alerts || []) as Array<{ severity: string; status: string }>
    const openAlerts = alerts.filter((a) => a.status === "open")
    return {
      ...p,
      alertCount: openAlerts.length,
      highSeverityAlerts: openAlerts.filter((a) => a.severity === "high").length,
      mediumSeverityAlerts: openAlerts.filter((a) => a.severity === "medium").length,
    }
  })

  // Filter by severity if specified
  const filteredProviders = severityFilter
    ? providersWithAlertCounts.filter((p) => {
        if (severityFilter === "high") return p.highSeverityAlerts > 0
        if (severityFilter === "medium") return p.mediumSeverityAlerts > 0
        return p.alertCount > 0
      })
    : providersWithAlertCounts

  const totalProviders = providers?.length || 0
  const withAlerts = providersWithAlertCounts.filter((p) => p.alertCount > 0).length
  const suspended = providersWithAlertCounts.filter((p) => p.is_suspended).length
  const proTier = providersWithAlertCounts.filter((p) => p.tier === "pro").length

  return (
    <DashboardShell
      title="Providers"
      subtitle="Manage marketplace providers, monitor alerts, and take action on quality issues."
      nav={NAV}
    >
      {/* Stats */}
      <div className="mb-6 grid grid-cols-4 gap-4">
        <div className="rounded border border-border bg-card p-4">
          <p className="text-2xl font-bold text-foreground">{totalProviders}</p>
          <p className="text-xs text-muted-foreground">Total Providers</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className="text-2xl font-bold text-yellow-600">{withAlerts}</p>
          <p className="text-xs text-muted-foreground">With Alerts</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className="text-2xl font-bold text-red-600">{suspended}</p>
          <p className="text-xs text-muted-foreground">Suspended</p>
        </div>
        <div className="rounded border border-border bg-card p-4">
          <p className="text-2xl font-bold text-accent">{proTier}</p>
          <p className="text-xs text-muted-foreground">Pro Tier</p>
        </div>
      </div>

{/* Filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href="/admin/providers?filter=all"
          className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "all"
              ? "border-foreground bg-foreground text-primary-foreground"
              : "border-border bg-background text-muted-foreground hover:border-accent"
          }`}
        >
          All
        </Link>
        <Link
          href="/admin/providers?filter=with-alerts"
          className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "with-alerts"
              ? "border-yellow-500 bg-yellow-500 text-white"
              : "border-border bg-background text-muted-foreground hover:border-yellow-500"
          }`}
        >
          With Alerts
        </Link>
        <Link
          href="/admin/providers?filter=suspended"
          className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "suspended"
              ? "border-red-500 bg-red-500 text-white"
              : "border-border bg-background text-muted-foreground hover:border-red-500"
          }`}
        >
          Suspended
        </Link>
        <Link
          href="/admin/providers?filter=pro"
          className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
            filter === "pro"
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-background text-muted-foreground hover:border-accent"
          }`}
        >
          Pro Tier
        </Link>
      </div>

      <Panel title={`Providers (${filteredProviders.length})`}>
        <div className="space-y-3">
          {filteredProviders.map((provider) => (
            <div
              key={provider.id}
              className="grid grid-cols-1 gap-3 border border-border bg-background p-4 md:grid-cols-12"
            >
              {/* Provider Info */}
              <div className="md:col-span-3">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-base font-medium text-foreground">
                    {provider.display_name || "Unnamed"}
                  </p>
                  {provider.tier === "pro" && (
                    <span className="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-accent-foreground">
                      PRO
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] uppercase text-muted-foreground">
                  {provider.kind}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {provider.alertCount > 0 && (
                    <>
                      {provider.highSeverityAlerts > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-red-600">
                          <AlertTriangle className="h-3 w-3" />
                          {provider.highSeverityAlerts} high
                        </span>
                      )}
                      {provider.mediumSeverityAlerts > 0 && (
                        <span className="flex items-center gap-1 text-[10px] text-yellow-600">
                          <AlertTriangle className="h-3 w-3" />
                          {provider.mediumSeverityAlerts} medium
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground">
                  {[provider.district, provider.state].filter(Boolean).join(", ") || "—"}
                </p>
              </div>

              {/* Date */}
              <div className="md:col-span-2">
                <p className="font-mono text-xs text-muted-foreground">
                  {new Date(provider.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <div className="flex flex-wrap gap-1">
                  <span
                    className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase ${
                      provider.is_active && !provider.is_suspended
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-red-50 text-red-600"
                    }`}
                  >
                    {provider.is_suspended
                      ? "Suspended"
                      : provider.is_active
                      ? "Active"
                      : "Inactive"}
                  </span>
                  {provider.alertCount > 0 && (
                    <span
                      className={`inline-block px-2 py-0.5 font-mono text-[10px] uppercase ${
                        provider.highSeverityAlerts > 0
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {provider.alertCount} Alert{provider.alertCount > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2 md:col-span-3 md:justify-end">
                <Link
                  href={`/admin/providers/${provider.id}`}
                  className="rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-accent"
                >
                  View
                </Link>

                <form action={flagProvider.bind(null, provider.id)}>
                  <button
                    type="submit"
                    className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-yellow-500 hover:text-yellow-600"
                  >
                    <Flag className="h-3 w-3" />
                    Flag
                  </button>
                </form>

                {provider.is_suspended ? (
                  <form action={activateProvider.bind(null, provider.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-emerald-500 hover:text-emerald-600"
                    >
                      <CheckCircle className="h-3 w-3" />
                      Activate
                    </button>
                  </form>
                ) : (
                  <form action={suspendProvider.bind(null, provider.id)}>
                    <button
                      type="submit"
                      className="flex items-center gap-1 rounded border border-border px-3 py-1.5 text-xs text-foreground transition-colors hover:border-red-500 hover:text-red-600"
                    >
                      <XCircle className="h-3 w-3" />
                      Suspend
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {filteredProviders.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">No providers found matching the selected filter.</p>
            </div>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
