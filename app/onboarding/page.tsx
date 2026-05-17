import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export const dynamic = "force-dynamic"

export default async function OnboardingRedirectPage() {
  const supabase = await getSupabaseSsrClient()

  if (!supabase) {
    return redirect("/sign-in")
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  const role = profile?.role

  if (role === "studio_manager") {
    return redirect("/studioonboard")
  }

  if (role === "artist") {
    return redirect("/artistonboard")
  }

  return redirect("/")
}
