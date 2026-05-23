import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"
import { ArrowRight, Brush, Building2, Sparkles } from "lucide-react"

export const metadata: Metadata = {
  title: "Get Started | Leish!",
  description: "Choose how you want to use Leish! — as a customer, artist, or studio.",
}

const ROLES = [
  {
    id: "customer",
    title: "Customer",
    description: "Browse artists and studios, book appointments, and manage your bookings.",
    icon: Sparkles,
    href: "/artists",
    cta: "Browse Artists",
    color: "border-blue-500/20 hover:border-blue-500/50",
    iconColor: "text-blue-500",
  },
  {
    id: "artist",
    title: "Makeup Artist",
    description: "List your services, manage availability, accept bookings, and grow your clientele.",
    icon: Brush,
    href: "/artistonboard",
    cta: "Get Started",
    color: "border-emerald-500/20 hover:border-emerald-500/50",
    iconColor: "text-emerald-500",
  },
  {
    id: "studio",
    title: "Studio Owner",
    description: "Set up your studio profile, manage your team, and receive bookings from clients.",
    icon: Building2,
    href: "/studioonboard",
    cta: "Set Up Studio",
    color: "border-amber-500/20 hover:border-amber-500/50",
    iconColor: "text-amber-500",
  },
]

export default async function OnboardingPage() {
  const supabase = await getSupabaseSsrClient()
  let userRole: string | null = null

  if (supabase) {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle()
      userRole = profile?.role || null
    }
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Get Started
          </p>
          <h1 className="mt-3 font-serif text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            How do you want to use Leish?
          </h1>
          <p className="mt-4 text-sm text-muted-foreground max-w-lg mx-auto">
            Choose the path that fits you best. You can always switch roles later.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ROLES.map((role) => {
            const Icon = role.icon
            const isActive = userRole === role.id
            return (
              <div
                key={role.id}
                className={`group rounded-xl border-2 ${role.color} bg-card p-6 transition-all ${
                  isActive ? "ring-2 ring-accent/20" : ""
                }`}
              >
                <div className={`mb-4 ${role.iconColor}`}>
                  <Icon className="h-8 w-8" />
                </div>
                <h2 className="font-serif text-xl font-medium text-foreground">
                  {role.title}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {role.description}
                </p>
                <Link
                  href={role.href}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-accent transition-colors hover:text-foreground"
                >
                  {role.cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            )
          })}
        </div>

        {userRole && (
          <div className="mt-12 text-center">
            <p className="text-sm text-muted-foreground">
              Already set up as <strong>{userRole === "studio" ? "Studio Owner" : userRole}</strong>?{" "}
              <Link href="/account" className="text-accent hover:text-foreground">
                Go to your account
              </Link>
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
