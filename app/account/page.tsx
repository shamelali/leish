export const dynamic = "force-dynamic"

import Link from "next/link"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { Calendar, Clock, MapPin, User } from "lucide-react"

export const metadata = {
  title: "My Account | Leish!",
  description: "Manage your bookings and profile.",
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  payment_required: "Payment Required",
  confirmed: "Confirmed",
  paid_deposit: "Paid (Deposit)",
  paid_full: "Paid (Full)",
  completed: "Completed",
  canceled: "Canceled",
  refunded: "Refunded",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  payment_required: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  paid_deposit: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  paid_full: "bg-green-500/10 text-green-600 border-green-500/20",
  completed: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  canceled: "bg-red-500/10 text-red-600 border-red-500/20",
  refunded: "bg-gray-500/10 text-gray-600 border-gray-500/20",
}

export default async function AccountPage() {
  const supabase = await getSupabaseSsrClient()

  if (!supabase) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in to view your account.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            Register
          </Link>
        </div>
      </div>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Please sign in to view your account.
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent"
          >
            Register
          </Link>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle()

  // Fetch bookings for customer
  let bookings: any[] = []
  if (profile?.role === "customer") {
    const { data } = await supabase
      .from("bookings")
      .select(`
        id,
        status,
        total_amount_myr,
        paid_amount_myr,
        notes,
        created_at,
        services (name, duration_minutes, price_myr),
        providers (display_name, kind, slug, state, district)
      `)
      .eq("customer_id", user.id)
      .order("created_at", { ascending: false })

    bookings = data || []
  }

  // Fetch provider dashboard link if artist or studio_manager
  let providerSlug: string | null = null
  if (profile?.role === "artist" || profile?.role === "studio_manager") {
    const { data: provider } = await supabase
      .from("providers")
      .select("slug")
      .eq("owner_id", user.id)
      .eq("kind", profile.role === "artist" ? "artist" : "studio")
      .maybeSingle()

    providerSlug = provider?.slug || null
  }

  const upcomingBookings = bookings.filter(
    (b) => !["completed", "canceled", "refunded"].includes(b.status)
  )
  const pastBookings = bookings.filter((b) =>
    ["completed", "canceled", "refunded"].includes(b.status)
  )

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        {/* Profile header */}
        <div className="mb-10 flex items-start justify-between border-b border-border pb-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
              My Account
            </p>
            <h1 className="mt-3 font-serif text-3xl font-medium tracking-tight text-foreground md:text-4xl">
              {profile?.full_name || "Welcome"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile?.role === "customer" && "Customer"}
              {profile?.role === "artist" && "Makeup Artist"}
              {profile?.role === "studio_manager" && "Studio Manager"}
              {profile?.role === "admin" && "Administrator"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {profile?.role === "artist" && providerSlug && (
              <Link
                href={`/artists/${providerSlug}`}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                View Profile
              </Link>
            )}
            {profile?.role === "studio_manager" && providerSlug && (
              <Link
                href={`/studios/${providerSlug}`}
                className="inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                View Studio
              </Link>
            )}
            {(profile?.role === "artist" || profile?.role === "studio_manager") && (
              <Link
                href="/studios/dashboard"
                className="inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-2 text-xs font-medium uppercase tracking-widest text-primary-foreground transition-colors hover:bg-accent hover:border-accent"
              >
                Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* Customer bookings */}
        {profile?.role === "customer" && (
          <>
            {/* Upcoming bookings */}
            <div className="mb-10">
              <h2 className="mb-6 font-serif text-xl font-medium text-foreground">
                Upcoming Bookings
              </h2>
              {upcomingBookings.length === 0 ? (
                <div className="rounded-lg border border-border bg-card p-8 text-center">
                  <Calendar className="mx-auto mb-4 h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No upcoming bookings.
                  </p>
                  <Link
                    href="/artists"
                    className="mt-4 inline-flex items-center gap-2 border border-border px-4 py-2 text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                  >
                    Browse Artists
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} />
                  ))}
                </div>
              )}
            </div>

            {/* Past bookings */}
            {pastBookings.length > 0 && (
              <div>
                <h2 className="mb-6 font-serif text-xl font-medium text-foreground">
                  Past Bookings
                </h2>
                <div className="space-y-4">
                  {pastBookings.map((booking) => (
                    <BookingCard key={booking.id} booking={booking} muted />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Artist/Studio Manager quick links */}
        {(profile?.role === "artist" || profile?.role === "studio_manager") && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              href="/studios/dashboard"
              icon={<Calendar className="h-5 w-5" />}
              title="Bookings"
              description="Manage your upcoming and past bookings"
            />
            <QuickLink
              href="/studios/dashboard?tab=availability"
              icon={<Clock className="h-5 w-5" />}
              title="Availability"
              description="Set your available time slots"
            />
            <QuickLink
              href="/studios/dashboard?tab=reviews"
              icon={<User className="h-5 w-5" />}
              title="Reviews"
              description="View and respond to client reviews"
            />
          </div>
        )}
      </div>
    </section>
  )
}

function BookingCard({
  booking,
  muted = false,
}: {
  booking: any
  muted?: boolean
}) {
  const statusLabel = STATUS_LABELS[booking.status] || booking.status
  const statusColor = STATUS_COLORS[booking.status] || "bg-gray-500/10 text-gray-600 border-gray-500/20"

  return (
    <div
      className={`rounded-lg border border-border bg-card p-5 ${
        muted ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-serif text-lg font-medium text-foreground">
            {booking.providers?.display_name || "Unknown Provider"}
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {booking.providers?.kind === "studio" ? "Studio" : "Artist"} ·{" "}
            {booking.providers?.state}
            {booking.providers?.district
              ? `, ${booking.providers.district}`
              : ""}
          </p>
        </div>
        <span
          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusColor}`}
        >
          {statusLabel}
        </span>
      </div>
      {booking.services && (
        <div className="mt-4 border-t border-border pt-4">
          <p className="text-sm font-medium text-foreground">
            {booking.services.name}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {booking.services.duration_minutes} minutes · MYR{" "}
            {booking.services.price_myr}
          </p>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
        <p className="text-sm font-medium text-foreground">
          MYR {booking.total_amount_myr}
        </p>
        <p className="text-xs text-muted-foreground">
          Booked {new Date(booking.created_at).toLocaleDateString()}
        </p>
      </div>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  title,
  description,
}: {
  href: string
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-lg border border-border bg-card p-6 transition-colors hover:border-accent"
    >
      <div className="mb-4 text-muted-foreground transition-colors group-hover:text-accent">
        {icon}
      </div>
      <h3 className="font-serif text-base font-medium text-foreground">
        {title}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </Link>
  )
}
