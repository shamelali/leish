import type { Metadata } from "next"
import Link from "next/link"
import { SupabaseAuth } from "@/components/supabase-auth"

export const metadata: Metadata = {
  title: "Sign In | Leish!",
  description: "Sign in to your Leish! account.",
}

export default function SignInPage() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Sign In
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Access your account to manage bookings and availability.
        </p>
        <div className="mt-8">
          <SupabaseAuth defaultMode="signin" hideToggle />
        </div>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="text-accent hover:text-foreground">
            Sign Up
          </Link>
        </p>
      </div>
    </section>
  )
}
