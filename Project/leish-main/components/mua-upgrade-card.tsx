"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"

export function MuaUpgradeCard() {
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleUpgrade() {
    setLoading(true)
    setError(null)
    setMessage(null)

    if (!supabase) {
      setError("Supabase is not configured.")
      setLoading(false)
      return
    }

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error("Please sign in again.")

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ subscription_tier: "pro", updated_at: new Date().toISOString() })
        .eq("id", user.id)

      if (updateError) throw updateError

      setMessage("Leish Pro activated. Redirecting...")
      router.push("/artist")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to activate Pro.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pro is a premium package for MUAs. Once activated, sign-in will redirect you to the Pro Dashboard automatically.
      </p>
      {error ? <p className="text-sm text-red-500">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}
      <button
        type="button"
        onClick={handleUpgrade}
        disabled={loading}
        className="border border-accent px-3 py-2 text-xs text-foreground disabled:opacity-60"
      >
        {loading ? "Activating..." : "Activate Leish Pro"}
      </button>
    </div>
  )
}
