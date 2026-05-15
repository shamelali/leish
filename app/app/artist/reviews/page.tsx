import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { getProDashboardData } from "@/lib/dashboard"

export const metadata = {
  title: "Pro Reviews | Leish!",
  description: "Manage reviews and responses.",
}

const STARS = (rating: number) => "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating))

const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  hidden: "Hidden",
  escalated: "Escalated",
  pending: "Pending",
}

const nav = [
  { href: "/artist", label: "Overview" },
  { href: "/artist/bookings", label: "Bookings" },
  { href: "/artist/payments", label: "Payments" },
  { href: "/artist/reviews", label: "Reviews", active: true },
  { href: "/artist/profile", label: "Profile" },
  { href: "/artist/availability", label: "Availability" },
]

export default async function ProReviewsPage() {
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

  const data = prov?.id ? await getProDashboardData() : { reviews: [] }

  // Aggregate stats
  const total = data.reviews.length
  const avgRating =
    total > 0
      ? (data.reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : "—"

  return (
    <DashboardShell title="Reviews" subtitle="Track feedback quality and respond to customers." nav={nav}>
      {/* Summary bar */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Total Reviews</p>
          <p className="mt-1 font-serif text-2xl text-foreground">{total}</p>
        </div>
        <div className="border border-border bg-card p-4">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Avg Rating</p>
          <p className="mt-1 font-serif text-2xl text-accent">{avgRating}</p>
        </div>
      </div>

      <Panel title={`Review Inbox (${total})`}>
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="border border-border bg-background p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-base text-foreground">{r.author}</p>
                  <p className="mt-0.5 font-mono text-sm text-accent">{STARS(r.rating)} {r.rating}/5</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="font-mono text-[10px] uppercase text-muted-foreground">
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{r.createdAt}</span>
                </div>
              </div>
              {r.text && (
                <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
              )}
            </div>
          ))}
          {total === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">No reviews yet.</p>
          )}
        </div>
      </Panel>
    </DashboardShell>
  )
}
