import { redirect } from "next/navigation"
import type { SupabaseClient } from "@supabase/supabase-js"
import { auth } from "./next-auth.server"

export type AppRole = "admin" | "artist" | "studio" | "customer"

export async function requireRole(
  supabase: SupabaseClient,
  allowedRoles: AppRole[],
  redirectTo = "/"
) {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("https://www.leish.my/sign-in")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  if (!profile || !allowedRoles.includes(profile.role as AppRole)) {
    redirect(redirectTo)
  }

  return { user: { id: session.user.id, email: session.user.email! }, role: profile.role as AppRole }
}
