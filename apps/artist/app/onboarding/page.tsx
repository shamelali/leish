import type { Metadata } from "next"
export const dynamic = "force-dynamic"

import Link from "next/link"
import { getSupabaseSsrClient } from "@leish/shared/lib/auth/ssr"
import { ArtistOnboardingWizard } from "@/components/artist-onboarding-wizard"

export const metadata: Metadata = {
  title: "Set Up Your Profile | Leish!",
  description: "Complete your artist profile to start receiving bookings.",
}

export default async function ArtistOnboardingPage() {
  const supabase = await getSupabaseSsrClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Sign in required</h1>
        <p className="mt-2 text-sm text-muted-foreground">Please sign in or create an account to set up your artist profile.</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href="/sign-in" className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent">Sign In</Link>
          <Link href="https://www.leish.my/sign-up" className="inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent">Register</Link>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase.from("profiles").select("role, full_name").eq("id", user.id).maybeSingle()

  if (!profile || profile.role !== "artist") {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Artist access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">This page is for makeup artists. If you&apos;re an artist, please contact support to update your role.</p>
        <Link href="/" className="mt-6 inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent">Go Home</Link>
      </div>
    )
  }

  const { data: existing } = await supabase.from("providers").select("id, slug, display_name").eq("owner_id", user.id).eq("kind", "artist").maybeSingle()

  if (existing) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-serif text-2xl text-foreground">Profile already set up</h1>
        <p className="mt-2 text-sm text-muted-foreground">You already have an artist profile as <strong>{existing.display_name}</strong>.</p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link href={`/${existing.slug}`} className="inline-flex items-center gap-2 border border-foreground bg-foreground px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-accent hover:border-accent">View Profile</Link>
          <Link href="/" className="inline-flex items-center gap-2 border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-accent">Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ArtistOnboardingWizard userId={user.id} initialName={profile.full_name || ""} />
    </div>
  )
}
