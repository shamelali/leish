import type { Metadata } from "next"
import Link from "next/link"
import { SupabaseAuth } from "@/components/supabase-auth"

export const metadata: Metadata = {
  title: "Sign Up | Leish!",
  description: "Create your Leish! account.",
}

export default function SignUpPage() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Sign Up
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create your account to get started with Leish!
        </p>
        <div className="mt-8">
          <SupabaseAuth defaultMode="signup" hideToggle />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-accent hover:text-foreground">
            Sign In
          </Link>
        </p>
      </div>
    </section>
  )
}
