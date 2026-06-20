"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { DashboardShell, Panel } from "@/components/dashboard-shell"
import { getSupabaseBrowserClient } from "@leish/shared/lib/auth/client"

interface Booking {
  id: string
  customer_id: string
  provider_id: string
  service_id: string
  slot_id: string
  status: string
  total_amount_myr: number
  notes: string | null
  created_at: string
  profiles: { full_name: string } | { full_name: string }[]
  services: { name: string } | { name: string }[]
}

const ALLOWED_ROLES = ["studio", "admin"]

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    async function load() {
      const supabase = getSupabaseBrowserClient()
      if (!supabase) { router.push("/sign-in"); return }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push("/sign-in"); return }

      const { data: profile } = await supabase
        .from("profiles").select("role").eq("id", user.id).maybeSingle()
      if (!profile || !ALLOWED_ROLES.includes(profile.role)) { router.push("/"); return }

      try {
        const res = await fetch("/api/bookings")
        if (res.ok) {
          const data = await res.json()
          setBookings(data)
        }
      } catch (e) {
        console.error("Failed to load bookings", e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [router])

  const resolveStatus = useCallback((action: string, currentStatus: string) => {
    if (action === "cancel") return "canceled"
    if (action === "confirm") return "confirmed"
    return currentStatus
  }, [])

  const handleAction = async (bookingId: string, action: string) => {
    try {
      const res = await fetch("/api/bookings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, action }),
      })
      if (res.ok) {
        setBookings((prev) =>
          prev.map((b) =>
            b.id === bookingId
              ? { ...b, status: resolveStatus(action, b.status) }
              : b,
          ),
        )
      }
    } catch (e) {
      console.error("Failed to update booking", e)
    }
  }

  const nav = [
    { href: "/", label: "Overview" },
    { href: "/bookings", label: "Bookings", active: true },
    { href: "/payments", label: "Payments" },
    { href: "/reviews", label: "Reviews" },
    { href: "/profile", label: "Profile" },
    { href: "/availability", label: "Availability" },
  ]

  let body: React.ReactNode
  if (loading) {
    body = (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 animate-pulse bg-muted rounded" />
        ))}
      </div>
    )
  } else if (bookings.length === 0) {
    body = (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">No bookings found.</p>
      </div>
    )
  } else {
    body = (
      <div className="space-y-2">
        {bookings.map((booking) => {
          const customerName = Array.isArray(booking.profiles)
            ? booking.profiles[0]?.full_name
            : (booking.profiles as { full_name: string } | undefined)?.full_name
          const serviceName = Array.isArray(booking.services)
            ? booking.services[0]?.name
            : (booking.services as { name: string } | undefined)?.name

          return (
            <div
              key={booking.id}
              className="flex items-center justify-between border border-border bg-background p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground truncate">
                  {customerName || "Client"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {serviceName || "Service"} &middot;{" "}
                  <span className="capitalize">{booking.status.replace("_", " ")}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  MYR {booking.total_amount_myr} &middot;{" "}
                  {new Date(booking.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-4">
                {booking.status === "pending" && (
                  <>
                    <button
                      onClick={() => handleAction(booking.id, "confirm")}
                      className="rounded border border-accent bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => handleAction(booking.id, "cancel")}
                      className="rounded border border-destructive px-3 py-1.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                    >
                      Cancel
                    </button>
                  </>
                )}
                {booking.status === "confirmed" && (
                  <button
                    onClick={() => handleAction(booking.id, "complete")}
                    className="rounded border border-accent bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition-colors hover:bg-accent/90"
                  >
                    Complete
                  </button>
                )}
                {booking.status === "paid_deposit" && (
                  <span className="text-xs text-muted-foreground">Deposit paid</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <DashboardShell
      title="Bookings"
      subtitle="Manage your studio bookings"
      nav={nav}
    >
      <Panel title="All Bookings">
        {body}
      </Panel>
    </DashboardShell>
  )
}
