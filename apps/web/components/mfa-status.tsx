"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ShieldCheck, ShieldOff, Loader2, Trash2 } from "lucide-react"

export function MFAStatus() {
  const { data: session, update } = useSession()
  const router = useRouter()
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [removing, setRemoving] = useState(false)

  useEffect(() => {
    const mfa = (session?.user as any)?.mfaEnabled
    setMfaEnabled(mfa ?? false)
    setLoading(false)
  }, [session])

  const handleRemove = async () => {
    if (!confirm("Disable two-factor authentication? Your account will be less secure.")) return
    setRemoving(true)
    setError(null)
    try {
      const res = await fetch("/api/auth/mfa/unenroll", { method: "POST" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to disable MFA")
      }
      setMfaEnabled(false)
      await update()
      router.refresh()
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setRemoving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading MFA status...</p>
  }

  return (
    <div className="space-y-4">
      {mfaEnabled ? (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" />
              <div>
                <p className="font-medium">Two-factor authentication is active</p>
                <p className="text-xs text-green-600">
                  Your account is protected with an authenticator app
                </p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              disabled={removing}
              className="flex items-center gap-1 rounded-md bg-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-200 disabled:opacity-50"
            >
              {removing ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-md bg-amber-50 p-4 text-sm text-amber-800">
          <div className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5" />
            <div>
              <p className="font-medium">Two-factor authentication is not enabled</p>
              <p className="text-xs text-amber-600">
                Add an extra layer of security to your account
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-md bg-red-100 p-3 text-sm text-red-800">{error}</div>
      )}
    </div>
  )
}
