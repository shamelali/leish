import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { StudioOnboardingBanner } from "@/components/studio-onboarding-banner"

export const metadata: Metadata = {
  title: "Studio Dashboard | Leish!",
  description: "Manage your studio, services, and bookings.",
}

export default async function StudioDashboardPage() {
  const supabase = await getSupabaseSsrClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("https://www.leish.my/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || profile.role !== "studio") redirect("/")

  const { data: studio } = await supabase
    .from("providers")
    .select(
      "id, slug, display_name, state, district, is_active, specialties, hourly_rate, rating, review_count",
    )
    .eq("owner_id", user.id)
    .eq("kind", "studio")
    .maybeSingle()

  if (!studio) redirect("/onboarding")

  const { data: bookings } = await supabase
    .from("bookings")
    .select(
      `
      id,
      status,
      total_amount_myr,
      created_at,
      profiles!customer_id(full_name),
      services!service_id(name)
    `,
    )
    .eq("provider_id", studio.id)
    .in("status", ["confirmed", "paid_deposit", "pending"])
    .order("created_at", { ascending: false })
    .limit(5)

  const { count: serviceCount } = await supabase
    .from("services")
    .select("id", { count: "exact", head: true })
    .eq("provider_id", studio.id)
    .eq("is_active", true)

  const stats = [
    {
      label: "Active Services",
      value: String(serviceCount ?? 0),
      hint: "Services available for booking",
    },
    {
      label: "Rating",
      value: studio.rating > 0 ? `${Number(studio.rating).toFixed(1)} ★` : "—",
      hint: `${studio.review_count ?? 0} reviews`,
    },
    {
      label: "Starting From",
      value: studio.hourly_rate > 0 ? `MYR ${studio.hourly_rate}` : "—",
      hint: "Per session",
    },
    {
      label: "Status",
      value: studio.is_active ? "Live" : "Pending Review",
      hint: studio.is_active ? "Visible to clients" : "Awaiting Leish approval",
    },
  ]

  const nav = [
    { href: "/", label: "Overview", active: true },
    { href: "/bookings", label: "Bookings" },
    { href: "/payments", label: "Payments" },
    { href: "/reviews", label: "Reviews" },
    { href: "/profile", label: "Profile" },
    { href: "/availability", label: "Availability" },
  ]

  return (
    <DashboardShell
      title="Studio Dashboard"
      subtitle={`${studio.display_name} · ${studio.state}${studio.district ? ", " + studio.district : ""}`}
      nav={nav}
    >
      {!studio.is_active && (
        <StudioOnboardingBanner studioName={studio.display_name} />
      )}

      <div className="mt-6">
        <StatGrid stats={stats} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Recent Bookings">
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const clientName =
                    (b.profiles as unknown as { full_name?: string }[])?.[0]
                      ?.full_name ?? "Client"
                  const serviceName =
                    (b.services as unknown as { name?: string }[])?.[0]?.name ??
                    "Service"
                  return (
                    <div
                      key={b.id}
                      className="flex items-center justify-between border border-border bg-background p-3"
                    >
                      <div>
                        <p className="font-serif text-base text-foreground">
                          {clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {serviceName} ·{" "}
                          <span className="capitalize">
                            {b.status.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      <p className="font-mono text-sm text-accent">
                        MYR {b.total_amount_myr}
                      </p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No bookings yet.{" "}
                {!studio.is_active
                  ? "Your studio is pending review — bookings will appear here once you're live."
                  : "Share your studio profile to start receiving bookings."}
              </p>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="Studio Snapshot">
            <div className="space-y-3">
              <p className="font-serif text-lg font-medium text-foreground">
                {studio.display_name}
              </p>
              <p className="text-sm text-muted-foreground">
                {studio.state}
                {studio.district ? `, ${studio.district}` : ""}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(studio.specialties as string[])?.map((s) => (
                  <span
                    key={s}
                    className="border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Quick Actions">
            <div className="space-y-2">
              <Link
                href={`/${studio.slug}`}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                View public page
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0 0L12 12" /></svg>
              </Link>
              <Link
                href="/onboarding"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Edit profile & services
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </Link>
              <Link
                href="/photos"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Manage photos
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              </Link>
              <Link
                href="/rooms"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                Manage rooms
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              </Link>
              <Link
                href="/bookings"
                className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent"
              >
                View bookings
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}
