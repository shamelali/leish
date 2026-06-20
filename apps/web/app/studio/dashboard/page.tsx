export const dynamic = "force-dynamic"

import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { StudioOnboardingBanner } from "@/components/studio-onboarding-banner"

export default async function StudioDashboardPage() {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || (profile.role !== "studio" && profile.role !== "studio_manager")) redirect("/")

  const { data: studio } = await supabase
    .from("providers")
    .select("id, slug, display_name, state, district, is_active, specialties, hourly_rate, rating, review_count")
    .eq("owner_id", user.id)
    .eq("kind", "studio")
    .maybeSingle()

  if (!studio) redirect("/studio/onboarding")

  const { data: bookings } = await supabase
    .from("bookings")
    .select(`id, status, total_amount_myr, created_at, profiles!customer_id(full_name), services!service_id(name)`)
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
    { label: "Active Services", value: String(serviceCount ?? 0), hint: "Services available for booking" },
    { label: "Rating", value: studio.rating > 0 ? `${Number(studio.rating).toFixed(1)} ★` : "—", hint: `${studio.review_count ?? 0} reviews` },
    { label: "Starting From", value: studio.hourly_rate > 0 ? `MYR ${studio.hourly_rate}` : "—", hint: "Per session" },
    { label: "Status", value: studio.is_active ? "Live" : "Pending Review", hint: studio.is_active ? "Visible to clients" : "Awaiting Leish approval" },
  ]

  const nav = [
    { href: "/studio/dashboard", label: "Overview", active: true },
    { href: "/studio/photos", label: "Photos" },
    { href: "/studio/rooms", label: "Rooms" },
  ]

  return (
    <DashboardShell title="Studio Dashboard" subtitle={`${studio.display_name} · ${studio.state}${studio.district ? ", " + studio.district : ""}`} nav={nav}>
      {!studio.is_active && <StudioOnboardingBanner studioName={studio.display_name} />}

      <div className="mt-6"><StatGrid stats={stats} /></div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Recent Bookings">
            {bookings && bookings.length > 0 ? (
              <div className="space-y-3">
                {bookings.map((b) => {
                  const clientName = (b.profiles as unknown as { full_name?: string })?.full_name ?? "Client"
                  const serviceName = (b.services as unknown as { name?: string })?.name ?? "Service"
                  return (
                    <div key={b.id} className="flex items-center justify-between border border-border bg-background p-3">
                      <div>
                        <p className="font-serif text-base text-foreground">{clientName}</p>
                        <p className="text-xs text-muted-foreground">{serviceName} · <span className="capitalize">{b.status.replace("_", " ")}</span></p>
                      </div>
                      <p className="font-mono text-sm text-accent">MYR {b.total_amount_myr}</p>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No bookings yet. {!studio.is_active ? "Your studio is pending review." : "Share your studio profile to start receiving bookings."}</p>
            )}
          </Panel>
        </div>
        <div className="space-y-6">
          <Panel title="Studio Snapshot">
            <div className="space-y-3">
              <p className="font-serif text-lg font-medium text-foreground">{studio.display_name}</p>
              <p className="text-sm text-muted-foreground">{studio.state}{studio.district ? `, ${studio.district}` : ""}</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {(studio.specialties as string[])?.map((s) => (
                  <span key={s} className="border border-border px-2 py-1 text-[10px] uppercase tracking-widest text-muted-foreground">{s}</span>
                ))}
              </div>
            </div>
          </Panel>
          <Panel title="Quick Actions">
            <div className="space-y-2">
              <Link href={`/studios/${studio.slug}`} className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent">View public page</Link>
              <Link href="/studio/onboarding" className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent">Edit profile & services</Link>
              <Link href="/studio/photos" className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent">Manage photos</Link>
              <Link href="/studio/rooms" className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent">Manage rooms</Link>
              <Link href="/account" className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-sm text-foreground transition-colors hover:border-accent hover:text-accent">My account</Link>
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}
