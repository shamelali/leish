"use client"

export const dynamic = "force-dynamic"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { routeUserAfterSignIn } from "@leish/shared/lib/auth/helpers"
import { Loader2, ShieldCheck } from "lucide-react"

export default function MfaPage() {
  const router = useRouter()
  const processed = useRef(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (processed.current) return
    processed.current = true

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      router.replace("/sign-in")
      return
    }

    // Check if we have a valid session first
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/sign-in")
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Client not initialized")
      setLoading(false)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace("/sign-in")
      return
    }

    // Verify MFA TOTP code
    const { data: factors } = await supabase.auth.mfa.listFactors()
    const totpFactor = factors?.totp?.[0]

    if (!totpFactor) {
      setError("No MFA factor found. Please contact support.")
      setLoading(false)
      return
    }

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: totpFactor.id,
      code: code.trim(),
    })

    if (verifyError) {
      setError(verifyError.message || "Invalid code. Please try again.")
      setLoading(false)
      return
    }

    // MFA verified — route user to their dashboard
    const redirect = await routeUserAfterSignIn(supabase, user.id)
    router.replace(redirect)
  }

  return (
    <section className="bg-background py-16 lg:py-24">
      <div className="mx-auto max-w-md px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
            <ShieldCheck className="h-8 w-8 text-accent" />
          </div>
          <h1 className="mt-6 font-serif text-3xl font-medium tracking-tight text-foreground">
            Two-Factor Authentication
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Enter the 6-digit code from your authenticator app.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="mfa-code" className="block text-sm font-medium">
              Authentication Code
            </label>
            <input
              id="mfa-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              placeholder="000000"
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-center text-2xl tracking-[0.5em] font-mono"
              autoFocus
              disabled={loading}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || code.length < 6}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify"
            )}
          </button>
        </form>
      </div>
    </section>
  )
}
