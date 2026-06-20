import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"

export type AppRole = "admin" | "artist" | "studio" | "customer"

export async function requireRole(
  supabase: SupabaseClient,
  allowedRoles: AppRole[],
  redirectTo = "/"
) {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("https://www.leish.my/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (!profile || !allowedRoles.includes(profile.role as AppRole)) {
    redirect(redirectTo)
  }

  return { user, role: profile.role as AppRole }
}
