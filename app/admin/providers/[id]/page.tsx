import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { activateProvider, suspendProvider } from "@/lib/actions/admin"
import { AlertTriangle, CheckCircle, XCircle, ArrowLeft } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await getSupabaseSsrClient()

  const { data: profile } = await supabase.auth.getUser()
  const { data: userProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", profile.user?.id)
    .single()

  if (!userProfile?.role || userProfile.role !== "admin") {
    return redirect("/")
  }

  const { data: provider, error } = await supabase
    .from("providers")
    .select(`
      *,
      profiles!providers_owner_id_fkey(full_name, email, phone),
      services(*),
      provider_alerts(*),
      reviews(*)
    `)
    .eq("id", id)
    .single()

  if (error || !provider) {
    notFound()
  }

  const { data: recentBookings } = await supabase
    .from("bookings")
    .select("id, status, total_amount_myr, paid_amount_myr, created_at, customer_id")
    .eq("provider_id", id)
    .order("created_at", { ascending: false })
    .limit(10)

  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/providers", label: "Providers", active: true },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/payments", label: "Payments" },
    { href: "/admin/moderation", label: "Moderation" },
  ]

  const openAlerts = (provider.provider_alerts || []).filter((a: any) => a.status === "open")

  return (
    <DashboardShell
      title={provider.display_name || "Provider"}
      subtitle={`${provider.kind} · ${[provider.district, provider.state].filter(Boolean).join(", ") || "—"}`}
      nav={nav}
    >
      <Link
        href="/admin/providers"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to providers
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Provider info */}
        <Panel title="Details" className="lg:col-span-2">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">ID</dt>
              <dd className="font-mono text-xs">{provider.id}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Kind</dt>
              <dd className="capitalize">{provider.kind}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd>
                {provider.is_suspended ? (
                  <span className="text-red-600">Suspended</span>
                ) : provider.is_active ? (
                  <span className="text-emerald-600">Active</span>
                ) : (
                  <span className="text-muted-foreground">Inactive</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Tier</dt>
              <dd>{provider.tier}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Owner</dt>
              <dd>{provider.profiles?.full_name || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{provider.profiles?.email || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Rating</dt>
              <dd>{provider.rating ? `${provider.rating}/5` : "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Review Count</dt>
              <dd>{provider.review_count || 0}</dd>
            </div>
          </dl>

          {provider.bio && (
            <div className="mt-4">
              <dt className="text-sm text-muted-foreground">Bio</dt>
              <dd className="mt-1 text-sm">{provider.bio}</dd>
            </div>
          )}

          <div className="mt-6 flex gap-2">
            {provider.is_suspended ? (
              <form action={activateProvider.bind(null, provider.id)}>
                <button className="flex items-center gap-1 rounded border border-emerald-500 px-3 py-1.5 text-xs text-emerald-600 transition-colors hover:bg-emerald-50">
                  <CheckCircle className="h-3 w-3" />
                  Activate
                </button>
              </form>
            ) : (
              <form action={suspendProvider.bind(null, provider.id)}>
                <button className="flex items-center gap-1 rounded border border-red-500 px-3 py-1.5 text-xs text-red-600 transition-colors hover:bg-red-50">
                  <XCircle className="h-3 w-3" />
                  Suspend
                </button>
              </form>
            )}
          </div>
        </Panel>

        {/* Alerts */}
        <Panel title={`Alerts (${openAlerts.length})`}>
          {openAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open alerts.</p>
          ) : (
            <div className="space-y-3">
              {openAlerts.map((alert: any) => (
                <div key={alert.id} className="rounded border border-border bg-background p-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === "high" ? "text-red-500" : "text-yellow-500"}`} />
                    <span className="text-xs font-medium capitalize">{alert.severity}</span>
                    <span className="text-xs text-muted-foreground">{alert.alert_type}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Services */}
      <div className="mt-6">
        <Panel title={`Services (${(provider.services || []).length})`}>
          {(provider.services || []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No services configured.</p>
          ) : (
            <div className="space-y-3">
              {(provider.services || []).map((service: any) => (
                <div key={service.id} className="flex items-center justify-between rounded border border-border bg-background p-3">
                  <div>
                    <p className="text-sm font-medium">{service.name}</p>
                    <p className="text-xs text-muted-foreground">{service.duration_minutes} min</p>
                  </div>
                  <p className="text-sm font-medium">MYR {service.price_myr}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      {/* Recent Bookings */}
      <div className="mt-6">
        <Panel title="Recent Bookings">
          {!recentBookings || recentBookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking: any) => (
                <div key={booking.id} className="flex items-center justify-between rounded border border-border bg-background p-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">{booking.id.slice(0, 8)}…</p>
                    <p className="text-xs text-muted-foreground">{new Date(booking.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">MYR {booking.total_amount_myr}</p>
                    <p className="text-xs capitalize text-muted-foreground">{booking.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </DashboardShell>
  )
}
