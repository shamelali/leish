"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

export function MFAChallenge() {
  const router = useRouter()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateSession = async (data: Record<string, unknown>) => {
    const { getCsrfToken } = await import("next-auth/react")
    const csrfToken = await getCsrfToken()
    const res = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csrfToken, data }),
    })
    if (!res.ok) throw new Error("Failed to update session")
    return res.json()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/auth/mfa/verify-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Invalid code")
      }

      await updateSession({ mfaVerified: true })
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="mfa-code" className="block text-sm font-medium text-foreground">
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
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div>
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
  )
}
