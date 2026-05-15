import { SupabaseAuth } from "@/components/supabase-auth"

export const metadata = {
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
          <SupabaseAuth />
        </div>
      </div>
    </section>
  )
}
