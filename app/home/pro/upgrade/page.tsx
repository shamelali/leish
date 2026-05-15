"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { DashboardShell } from "@/components/dashboard-shell"
import { Check, X, Loader2, Sparkles } from "lucide-react"

const FREE_FEATURES = [
  { name: "Public profile listing", included: true },
  { name: "Receive bookings", included: true },
  { name: "Basic dashboard", included: true },
  { name: "Up to 5 services", included: true },
  { name: "Up to 20 photos", included: true },
  { name: "10% commission per booking", included: true },
  { name: "Standard support", included: true },
  { name: "Advanced analytics", included: false },
  { name: "Featured placement", included: false },
  { name: "Priority support", included: false },
]

const PRO_FEATURES = [
  { name: "Public profile listing", included: true },
  { name: "Receive bookings", included: true },
  { name: "Advanced dashboard", included: true },
  { name: "Unlimited services", included: true },
  { name: "Up to 50 photos", included: true },
  { name: "5% commission per booking", included: true, highlight: true },
  { name: "Priority support", included: true },
  { name: "Advanced analytics", included: true },
  { name: "Featured placement", included: true },
  { name: "Priority support", included: true },
  { name: "Custom booking URLs", included: true },
  { name: "Export reports", included: true },
]

export default function ProUpgradePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = getSupabaseBrowserClient()
  
  const [loading, setLoading] = useState(true)
  const [provider, setProvider] = useState<{ id: string; tier: string; display_name: string } | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly")

  const upgraded = searchParams.get("upgraded") === "1"
  const cancelled = searchParams.get("upgrade") === "cancelled"

  const fetchProviderData = async () => {
    if (!supabase) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push("/sign-in")
      return
    }

    const { data: providerData } = await supabase
      .from("providers")
      .select("id, tier, display_name")
      .eq("owner_id", user.id)
      .eq("kind", "artist")
      .single()

    setProvider(providerData)
    setLoading(false)
  }

  useEffect(() => {
    queueMicrotask(() => fetchProviderData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpgrade = async () => {
    if (!provider) return
    
    setUpgrading(true)
    
    try {
      const res = await fetch("/api/subscription/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerId: provider.id,
          tier: "pro",
          billingCycle,
        }),
      })

      const data = await res.json()
      
      if (data.url) {
        window.location.href = data.url
      } else {
        alert("Failed to start upgrade. Please try again.")
      }
    } catch (error) {
      console.error("Upgrade error:", error)
      alert("An error occurred. Please try again.")
    } finally {
      setUpgrading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    )
  }

  const isPro = provider?.tier === "pro"

  const nav = [
    { href: "/pro", label: "Dashboard" },
    { href: "/pro/bookings", label: "Bookings" },
    { href: "/pro/services", label: "Services" },
    { href: "/pro/availability", label: "Availability" },
    { href: "/pro/profile", label: "Profile" },
    { href: "/pro/upgrade", label: "Upgrade", active: true },
  ]

  return (
    <DashboardShell
      title={isPro ? "Pro Subscription" : "Upgrade to Pro"}
      subtitle={isPro ? "Manage your Pro subscription" : "Unlock premium features and grow your business"}
      nav={nav}
    >
      {upgraded && (
        <div className="mb-6 rounded border border-emerald-500/20 bg-emerald-50 p-4 text-emerald-700">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span className="font-medium">Welcome to Pro!</span>
          </div>
          <p className="mt-1 text-sm">
            Your subscription is now active. Enjoy all the premium features!
          </p>
        </div>
      )}

      {cancelled && (
        <div className="mb-6 rounded border border-yellow-500/20 bg-yellow-50 p-4 text-yellow-700">
          <p className="text-sm">Upgrade cancelled. You can upgrade anytime from this page.</p>
        </div>
      )}

      {isPro ? (
        <div className="rounded-lg border border-accent bg-accent/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-medium">You{39}re on Pro!</h2>
              <p className="text-sm text-muted-foreground">
                Enjoy all premium features and reduced commission rates.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Commission Rate</p>
              <p className="mt-1 text-2xl font-bold text-accent">5%</p>
              <p className="text-xs text-muted-foreground">Save 5% per booking vs Free</p>
            </div>
            <div className="rounded border border-border bg-background p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Photo Limit</p>
              <p className="mt-1 text-2xl font-bold">50</p>
              <p className="text-xs text-muted-foreground">Showcase your best work</p>
            </div>
          </div>

          <div className="mt-6">
            <a
              href="https://billing.stripe.com/p/login/test"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block rounded border border-border px-4 py-2 text-sm transition-colors hover:border-accent"
            >
              Manage Billing →
            </a>
          </div>
        </div>
      ) : (
        <>
          {/* Pricing Toggle */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex rounded border border-border bg-background p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`rounded px-4 py-2 text-sm transition-colors ${
                  billingCycle === "monthly"
                    ? "bg-foreground text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`rounded px-4 py-2 text-sm transition-colors ${
                  billingCycle === "yearly"
                    ? "bg-foreground text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Yearly
                <span className="ml-1 text-[10px] text-emerald-600">-16%</span>
              </button>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Free Tier */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-serif text-xl font-medium">Free</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Perfect for getting started
              </p>
              <div className="mt-4">
                <span className="text-3xl font-bold">RM0</span>
                <span className="text-muted-foreground">/month</span>
              </div>

              <ul className="mt-6 space-y-3">
                {FREE_FEATURES.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2">
                    {feature.included ? (
                      <Check className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={feature.included ? "" : "text-muted-foreground"}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <div className="rounded bg-muted p-3 text-center text-sm text-muted-foreground">
                  Current Plan
                </div>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="relative rounded-lg border-2 border-accent bg-card p-6">
              <div className="absolute -top-3 left-4">
                <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                  RECOMMENDED
                </span>
              </div>

              <h3 className="font-serif text-xl font-medium">Pro</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                For serious professionals
              </p>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  RM{billingCycle === "monthly" ? "99" : "999"}
                </span>
                <span className="text-muted-foreground">
                  /{billingCycle === "monthly" ? "month" : "year"}
                </span>
                {billingCycle === "yearly" && (
                  <span className="ml-2 text-sm text-emerald-600">Save RM189</span>
                )}
              </div>

              <p className="mt-2 text-xs text-muted-foreground">
                14-day free trial. Cancel anytime.
              </p>

              <ul className="mt-6 space-y-3">
                {PRO_FEATURES.map((feature) => (
                  <li key={feature.name} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-accent" />
                    <span className={feature.highlight ? "font-medium text-accent" : ""}>
                      {feature.name}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full rounded border border-accent bg-accent px-4 py-3 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-60"
                >
                  {upgrading ? (
                    <>
                      <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    "Start Free Trial"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h2 className="font-serif text-xl font-medium">Frequently Asked Questions</h2>
            <div className="mt-6 space-y-4">
              <div>
                <h3 className="font-medium">Can I cancel anytime?</h3>
                <p className="text-sm text-muted-foreground">
                  Yes, you can cancel your subscription at any time. You{39}ll continue to have Pro access until the end of your billing period.
                </p>
              </div>
              <div>
                <h3 className="font-medium">What happens to my photos if I downgrade?</h3>
                <p className="text-sm text-muted-foreground">
                  If you have more than 20 photos when downgrading, you{39}ll have 30 days to reduce to the free tier limit before we hide excess photos.
                </p>
              </div>
              <div>
                <h3 className="font-medium">How does the commission work?</h3>
                <p className="text-sm text-muted-foreground">
                  The commission is deducted from each booking. With Pro, you keep 95% of your earnings instead of 90% with Free.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardShell>
  )
}