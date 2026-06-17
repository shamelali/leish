"use client"

import { useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { MFAService } from "@/lib/services/mfa"
import { Loader2, ShieldCheck } from "lucide-react"

export function MFAChallenge() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleVerify = async () => {
    setLoading(true)
    setError("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) {
      setError("Supabase client not initialized")
      setLoading(false)
      return
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData?.user) {
        setError("Unable to verify your identity")
        setLoading(false)
        return
      }

      const mfa = new MFAService(supabase)
      const factors = await mfa.listFactors()
      const verifiedFactor = factors.find((f) => f.verified)

      if (!verifiedFactor) {
        setError("No verified MFA factor found")
        setLoading(false)
        return
      }

      await mfa.verifyWithRateLimiting(userData.user.id, verifiedFactor.id, code)

      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

      if (aal?.currentLevel === "aal2") {
        window.location.href = "/"
      } else {
        setError("Failed to elevate session. Please try again.")
      }
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Verification failed. Check the code and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16 lg:py-24">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <ShieldCheck className="h-6 w-6 text-primary" />
        </div>
        <h1 className="mt-4 font-serif text-2xl font-medium text-foreground">
          Two-Factor Authentication
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter the code from your authenticator app to continue.
        </p>
      </div>

      <div className="mt-8">
        <label htmlFor="mfa-code" className="block text-sm font-medium text-foreground">
          Authentication Code
        </label>
        <input
          id="mfa-code"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          placeholder="000000"
          className="mt-2 block w-full rounded-md border border-input bg-background px-3 py-3 text-center text-2xl tracking-[0.5em]"
          autoFocus
        />
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <button
        onClick={handleVerify}
        disabled={loading || code.length < 6}
        className="mt-6 w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
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
    </div>
  )
}
