import { auth } from "./next-auth.server"
import { getSupabaseSsrClient } from "./ssr"
import { getPostAuthRedirect } from "./routing"

export async function handleAuthCallback() {
  const session = await auth()
  if (!session?.user?.id) return { redirect: "/sign-in" }

  const supabase = await getSupabaseSsrClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .maybeSingle()

  const rawRole = (profile?.role as string) || "customer"
  const role = rawRole === "studio_manager" ? "studio" : rawRole
  const kind = role === "artist" ? "artist" : "studio"

  const { data: provider } = role === "customer" || role === "admin"
    ? { data: null }
    : await supabase
        .from("providers")
        .select("id, slug")
        .eq("owner_id", session.user.id)
        .eq("kind", kind)
        .maybeSingle()

  return { redirect: getPostAuthRedirect(role as any, !!provider) }
}
