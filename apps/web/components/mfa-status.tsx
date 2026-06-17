"use client"

import { useEffect, useState } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { MFAService, type MFAFactor } from "@/lib/services/mfa"
import { TokenRevocationService } from "@/lib/services/token-revocation"
import { Loader2, Shield, ShieldCheck, Trash2 } from "lucide-react"

export function MFAStatus() {
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [aal, setAal] = useState<"aal1" | "aal2">("aal1")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [unenrolling, setUnenrolling] = useState<string | null>(null)

  useEffect(() => {
    const supabase = getSupabaseBrowserClient()

    const run = async () => {
      if (!supabase) {
        setLoading(false)
        return
      }

      const mfa = new MFAService(supabase)

      try {
        const [allFactors, currentAal] = await Promise.all([
          mfa.listFactors(),
          mfa.getAAL(),
        ])
        setFactors(allFactors)
        setAal(currentAal)
      } catch (err: unknown) {
        const e = err as { message?: string }
        setError(e.message || "Failed to load MFA status")
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const handleUnenroll = async (factorId: string) => {
    setUnenrolling(factorId)
    setError("")

    const supabase = getSupabaseBrowserClient()
    if (!supabase) return

    try {
      const mfa = new MFAService(supabase)
      await mfa.unenroll(factorId)
      setFactors((prev) => prev.filter((f) => f.id !== factorId))

      // Invalidate all sessions — user must sign in without MFA now
      const tokenService = new TokenRevocationService()
      await tokenService.signOutCurrentSession()

      // Redirect to sign-in after a brief delay
      setTimeout(() => {
        window.location.href = "/sign-in"
      }, 1500)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || "Failed to disable MFA")
    } finally {
      setUnenrolling(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading MFA status...
      </div>
    )
  }

  const verifiedFactors = factors.filter((f) => f.verified)
  const pendingFactors = factors.filter((f) => !f.verified)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {verifiedFactors.length > 0 ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <Shield className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="text-sm font-medium text-foreground">
            {verifiedFactors.length > 0 ? "Enabled" : "Disabled"}
          </span>
        </div>
        <span className="rounded-full border px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {aal === "aal2" ? "AAL2" : "AAL1"}
        </span>
      </div>

      {factors.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Two-factor authentication is not enabled. Add an authenticator app to secure your account.
        </p>
      )}

      {pendingFactors.length > 0 && (
        <div className="rounded-md bg-yellow-500/10 border border-yellow-500/20 p-3">
          <p className="text-xs text-yellow-800">
            You have pending MFA enrollments. Complete the verification to enable them.
          </p>
        </div>
      )}

      {verifiedFactors.map((factor) => (
        <div
          key={factor.id}
          className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Authenticator App
              </p>
              <p className="text-xs text-muted-foreground">
                Added {new Date(factor.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleUnenroll(factor.id)}
            disabled={unenrolling === factor.id}
            className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
            title="Remove MFA factor"
          >
            {unenrolling === factor.id ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
            Remove
          </button>
        </div>
      ))}

      {error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  )
}
