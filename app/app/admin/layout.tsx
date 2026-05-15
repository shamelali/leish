import Link from "next/link"
import { redirect } from "next/navigation"
import { getSupabaseSsrClient } from "@/lib/supabase/ssr"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  return (
    <>
      {children}
      <div className="mx-auto max-w-7xl px-6 pb-12 lg:px-8">
        <div className="rounded-xl border border-border bg-secondary p-4 text-sm text-muted-foreground">
          Admin access is enforced with Supabase session. Only `admin` role is permitted.
          <Link href="/sign-in" className="ml-2 text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </>
  )
}
