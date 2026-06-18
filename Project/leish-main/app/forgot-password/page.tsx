"use client"

import { useState } from "react"
import Link from "next/link"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Loader2, ArrowLeft, Mail } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Client not initialized. Please try again.")
      setLoading(false)
      return
    }

    const redirectTo = `${window.location.origin}/update-password`

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setSent(true)
    }
    setLoading(false)
  }

  if (sent) {
    return (
      <section className="bg-background py-16 lg:py-24">
        <div className="mx-auto max-w-md px-6 lg:px-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
            <Mail className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-foreground">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            If an account exists with <strong>{email}</strong>, we&apos;ve sent password reset instructions.
          </p>
          <Link
            href="/sign-in"
            className="mt-8 inline-flex items-center gap-2 text-sm text-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <h1 className="font-serif text-4xl font-medium tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium">
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </span>
            ) : (
              "Send reset link"
            )}
          </button>

          <Link
            href="/sign-in"
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to sign in
          </Link>
        </form>
      </div>
    </section>
  )
}
