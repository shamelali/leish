import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseSsrClient()

  if (!supabase) {
    redirect("/sign-in")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile) {
    redirect("/artist/onboarding")
  }

  const allowedRoles = ["artist", "studio_manager", "admin"]
  if (!allowedRoles.includes(profile.role)) {
    redirect("/artist/onboarding")
  }

  // Guard: if artist has no provider row yet, send to onboarding
  if (profile.role === "artist") {
    const { data: provider } = await supabase
      .from("providers")
      .select("id")
      .eq("owner_id", user.id)
      .eq("kind", "artist")
      .maybeSingle()

    if (!provider) {
      redirect("/artist/onboarding")
    }
  }

  return (
    <>
      {children}
      <div className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
          Pro access is enforced for premium MUAs (`profiles.role = &apos;artist&apos;` and `subscription_tier = &apos;pro&apos;`).
          <Link href="/sign-in" className="ml-2 text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </>
  )
}
