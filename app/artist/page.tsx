import { Suspense } from "react"
import Link from "next/link"
import { Crown, Sparkles } from "lucide-react"
import { DashboardShell, Panel, StatGrid } from "@/components/dashboard-shell"
import { getProDashboardData } from "@/lib/dashboard"
import { ArtistWelcomeBanner } from "@/components/artist-welcome-banner"
import { LoyaltyStatusCard } from "@/components/loyalty-status-card"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Pro Dashboard | Leish!",
  description: "Manage profile, services, bookings, and reviews.",
}

export default async function ProDashboardPage() {
  const supabase = await getSupabaseSsrClient()
  if (!supabase) {
    return <p className="p-8">Not authenticated</p>
  }
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return <p className="p-8">Not authenticated</p>
  }
  
  // Fetch provider with tier info
  const { data: prov } = await supabase
    .from("providers")
    .select("id, tier, is_suspended")
    .eq("owner_id", user.id)
    .limit(1)
    .maybeSingle()
  
  const providerId = prov?.id
  const isPro = prov?.tier === "pro"
  const isSuspended = prov?.is_suspended
  
  const data = providerId ? await getProDashboardData() : {
    provider: { name: "", location: "", hourlyRate: 0, specialties: [] as string[] },
    stats: [],
    upcomingBookings: [],
    reviews: [],
    payouts: [],
  }
  const nav = [
    { href: "/artist", label: "Overview", active: true },
    { href: "/artist/bookings", label: "Bookings" },
    { href: "/artist/payments", label: "Payments" },
    { href: "/artist/reviews", label: "Reviews" },
    { href: "/artist/profile", label: "Profile" },
    { href: "/artist/availability", label: "Availability" },
    { href: "/artist/charges", label: "Charges & Fees" },
  ]

  return (
    <DashboardShell
      title="Pro Dashboard"
      subtitle="Operational workspace for artists and studios to manage services, bookings, reviews, and payouts."
      nav={nav}
    >
      <Suspense fallback={null}>
        <ArtistWelcomeBanner />
      </Suspense>
      
      {/* Suspension warning */}
      {isSuspended && (
        <div className="mb-6 rounded-lg border border-destructive bg-destructive/10 p-4">
          <p className="text-sm font-medium text-destructive">
            Your account is suspended. Please contact support for more information.
          </p>
        </div>
      )}
      
      {/* Upgrade banner for free tier */}
      {!isPro && !isSuspended && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-accent bg-accent/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/20">
              <Crown className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground">Upgrade to Pro</p>
              <p className="text-sm text-muted-foreground">Unlock unlimited clients, automation, and analytics</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      )}
      
      {/* Pro badge for premium users */}
      {isPro && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-accent bg-accent/5 px-4 py-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-foreground">You&#39;re on Pro plan</span>
        </div>
      )}
      
      <StatGrid stats={data.stats} />

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-6">
          <Panel title="Upcoming Bookings">
            <div className="space-y-3">
              {data.upcomingBookings.map((b, idx: number) => (
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

          <Panel title="Recent Reviews">
            <div className="space-y-3">
              {data.reviews.map((r, idx: number) => (
                <div key={`${r.author}-${idx}`} className="border border-border bg-background p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-base text-foreground">{r.author}</p>
                    <p className="font-mono text-xs text-muted-foreground">{r.status}</p>
                  </div>
                  <p className="mt-1 text-xs text-accent">Rating: {r.rating}/5</p>
                  <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <div className="space-y-6">
          <LoyaltyStatusCard />

          <Panel title="Provider Snapshot">
            <div className="space-y-2">
              <p className="font-serif text-lg text-foreground">{data.provider.name}</p>
              <p className="text-sm text-muted-foreground">{data.provider.location}</p>
              <p className="font-mono text-sm text-accent">MYR {data.provider.hourlyRate}/hr</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.provider.specialties.map((s) => (
                  <span key={s} className="border border-border px-2 py-1 font-mono text-[10px] uppercase text-muted-foreground">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </Panel>

          <Panel title="Payouts">
            <div className="space-y-3">
              {data.payouts.map((p) => (
                <div key={p.period} className="border border-border bg-background p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-serif text-base text-foreground">{p.period}</p>
                    <p className="font-mono text-xs text-muted-foreground">{p.status}</p>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Gross: {p.gross}</p>
                  <p className="text-xs text-muted-foreground">Fees: {p.fees}</p>
                  <p className="font-mono text-sm text-accent">Net: {p.net}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </DashboardShell>
  )
}