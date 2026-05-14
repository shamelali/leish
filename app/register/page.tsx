import { SupabaseAuth } from "@/components/supabase-auth"

export const metadata = {
  title: "Sign Up | Leish!",
  description: "Create an account to book artists or offer your services.",
}

export default function RegisterPage() {
  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Sign Up
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Create an account to book artists or offer your services.
        </p>
        <div className="mt-8">
          <SupabaseAuth defaultSignUp={true} />
        </div>
      </div>
    </section>
  )
}