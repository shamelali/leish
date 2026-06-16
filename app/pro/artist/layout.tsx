export const dynamic = "force-dynamic"

import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export default async function ProLayout({ children }: { children: React.ReactNode }) {
  const supabase = await getSupabaseSsrClient()
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
    redirect("/")
  }

  const allowedRoles = ["artist", "studio", "admin"]
  if (!allowedRoles.includes(profile.role)) {
    redirect("/")
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
      redirect("/pro/artist/onboarding")
    }
  }

  return <>{children}</>

}
